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
      console.log('d')
      spin.start('Starting breakout room manager...')
      console.log('e')
      const { agreeableKey } = await roomManager.startAgreeable(config, expectations, validateParticipant)
      console.log('f')
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
    messages.push(`[Remote] ${JSON.stringify(m)}`);
    refreshDisplay();
  });

  function refreshDisplay() {
    console.clear();
    // Show last N messages that fit in the screen
    const lastMessages = messages.slice(-process.stdout.rows + 3);
    console.log(lastMessages.join('\n'));
    console.log('\n─'.repeat(process.stdout.columns));
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
