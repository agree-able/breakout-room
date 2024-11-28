#!/usr/bin/env node
import rc from 'run-con'
import { RoomManager, BreakoutRoom } from '@agree-able/room'
import { handleInvite } from '@agree-able/invite'
import { confirmRoomEnter, gatherExpectations, validateParticipant } from './userConfirmation.mjs'

const config = rc('breakout-room', {})

async function run () {
  const { invite } = await handleInvite(config, confirmRoomEnter)
  if (invite) {
    const room = new BreakoutRoom({ invite })
    await room.ready()
    room.installSIGHandlers() // handle shutdown signals
    onRoom(room)
  } else {
    const roomManager = new RoomManager()
    const expectations = await gatherExpectations(config)
    const { agreeableKey } = await roomManager.startAgreeable(config, expectations, validateParticipant) 
    console.log(`agreeableKey:`, agreeableKey)
    roomManager.on('readyRoom', onRoom)
    roomManager.installSIGHandlers() // handle shutdown signals
  }
}

function onRoom (room) {
  roomPrint(room, `Room invite: ${room.getRoomInfo().invite}`);
  process.stdin.on('data', async (data) => await room.message(data.toString()))
  room.on('peerEntered', (peerKey) => console.log('peer entered the room', peerKey))
  room.on('peerLeft', async (peerKey) => console.log('peer left the room', peerKey))
  room.on('message', async (m) => console.log('remote message recieved', m))
}

function roomPrint(room, message) {
  console.log(`${room.getRoomInfo().roomId}: ${message}`);
}

run()
