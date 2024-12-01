#!/usr/bin/env node
import rc from 'run-con'
import { RoomManager, BreakoutRoom } from '@agree-able/room'
import { handleInvite } from '@agree-able/invite'
import readline from 'readline'
import pc from 'picocolors'
import { isCancel, intro, outro, log, text, spinner, note } from '@clack/prompts'
import { validateAndUpdateConfig, confirmRoomEnter, gatherExpectations, validateParticipant } from './userConfirmation.mjs'

const config = rc('breakout-room', {})

async function run () {
  await validateAndUpdateConfig(config)
  const _confirmRoomEnter = confirmRoomEnter.bind(null, config) // just so we can get the config
  const _validateParticipant = validateParticipant.bind(null, config)
  const { invite } = await handleInvite(config, _confirmRoomEnter)
  if (invite) {
    const room = new BreakoutRoom({ invite })
    await room.ready()
    room.installSIGHandlers() // handle shutdown signals
    onRoom(room)
  } else {
    const roomManager = new RoomManager()
    const expectations = await gatherExpectations(config)
    try {
      const spin = spinner()
      spin.start('Starting breakout room manager...')
      const { agreeableKey } = await roomManager.startAgreeable(config, expectations, _validateParticipant)
      spin.stop('breakout room running')
      log.info(`agreeableKey: ${agreeableKey}`)
      roomManager.on('readyRoom', onRoom)
      roomManager.installSIGHandlers() // handle shutdown signals
    } catch (err) {
      console.log('error', err)
      process.exit(1)
    }
  }
}

async function onRoom(room) {
  const isHost = !room.getRoomInfo().invite
  const youKey = room.getRoomInfo().metadata.who.substring(0, 6)
  const agreeableKey = room.getRoomInfo().agreeableKey
  
  // Clear screen
  console.clear();
  
  if (isHost) {
    log.info(`Share this agreeableKey with peers: ${agreeableKey}`)
  } else {
    log.info(`Room invite: ${room.getRoomInfo().invite}`)
  }
  
  const messages = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Handle incoming messages
  room.on('peerEntered', (peerKey) => {
    messages.push(`>> Peer entered: ${peerKey}`);
    refreshDisplay();
    if (isHost) {
      rl.resume();
    }
  });
  
  room.on('peerLeft', async (peerKey) => {
    if (isHost) {
      console.clear();
      log.info('Peer left. Waiting for new peer...');
      log.info(`Share this agreeableKey with peers: ${agreeableKey}`);
      messages.length = 0; // Clear messages
      rl.pause();
    } else {
      messages.push(`>> Peer left: ${peerKey}`);
      refreshDisplay();
    }
  });
  
  room.on('message', async (m) => {
    const peerKey = m.who.substring(0, 6);
    messages.push(`[${pc.dim('peer')} ${peerKey}] ${m.data}`);
    refreshDisplay();
  });

  function refreshDisplay() {
    console.clear();
    
    // Calculate available space for messages
    const availableRows = process.stdout.rows - 2; // Reserve 2 rows for input and divider
    
    // Get messages that will fit
    const lastMessages = messages.slice(-availableRows);
    
    // Print messages
    if (lastMessages.length > 0) {
      console.log(lastMessages.join('\n'));
    }
    
    // Position cursor and show prompt
    process.stdout.write('\n' + '─'.repeat(process.stdout.columns) + '\n');
    rl.prompt(true);
  }

  rl.setPrompt('Message > ');
  rl.prompt();

  rl.on('line', async (input) => {
    if (input.toLowerCase() === '/quit') {
      await room.exit();
      rl.close();
      outro('Goodbye!');
      process.exit(0);
    }
    
    messages.push(`[${pc.bold('You')}  ${pc.green(youKey)}] ${input}`);
    room.message(input);
    refreshDisplay();
  });

  // Handle window resize
  process.stdout.on('resize', () => {
    refreshDisplay();
  });
}

intro('Welcome to breakout-room CLI!')
run()
