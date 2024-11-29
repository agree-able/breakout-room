#!/usr/bin/env node
import rc from 'run-con'
import { RoomManager, BreakoutRoom } from '@agree-able/room'
import { handleInvite } from '@agree-able/invite'
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

async function onRoom (room) {
  log.info(`Room invite: ${room.getRoomInfo().invite}`)
  let keepGoing = true
  room.on('peerEntered', (peerKey) => log.info(`peer entered the room, ${peerKey}`))
  room.on('peerLeft', async (peerKey) => log.info(`peer left the room, ${peerKey}`))
  room.on('message', async (m) => log.info(`remote message recieved', ${JSON.stringify(m)}`))
  while (keepGoing) {
    const message = await text({
      message: 'Send a message...',
      placeholder: 'message to send',
      validate (value) {
        if (value.length === 0) return 'Value is required!'
      }
    })
    if (isCancel(message)) {
      keepGoing = false
      await room.exit()
      outro('Goodbye!')
      process.exit(0)
    }
    room.message(message)
  }
}

intro('Welcome to breakout-room CLI!')
run()
