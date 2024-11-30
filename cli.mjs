#!/usr/bin/env node
import rc from 'run-con'
import { RoomManager, BreakoutRoom } from '@agree-able/room'
import { handleInvite } from '@agree-able/invite'
import readline from 'readline'
import { isCancel, intro, outro, log, text, spinner, note } from '@clack/prompts'
import { validateAndUpdateConfig, confirmRoomEnter, gatherExpectations, validateParticipant } from './userConfirmation.mjs'

const config = rc('breakout-room', {})

async function run () {
  await validateAndUpdateConfig(config)
  const { invite } = await handleInvite(config, confirmRoomEnter)
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
      const { agreeableKey } = await roomManager.startAgreeable(config, expectations, validateParticipant)
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
  log.info(`Room invite: ${room.getRoomInfo().invite}`)
  
  // Clear screen
  console.clear();
  
  const messages = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Handle incoming messages
  room.on('peerEntered', (peerKey) => {
    messages.push(`>> Peer entered: ${peerKey}`);
    refreshDisplay();
  });
  
  room.on('peerLeft', async (peerKey) => {
    messages.push(`>> Peer left: ${peerKey}`);
    refreshDisplay();
  });
  
  room.on('message', async (m) => {
    messages.push(`[Remote] ${m.data}`);
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
    
    messages.push(`[You] ${input}`);
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
