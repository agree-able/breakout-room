#!/usr/bin/env node
import { BreakoutRoom } from '@agree-able/room'
import { load } from '@agree-able/invite'
import rc from 'run-con'

const config = rc('breakout-room', {})

async function run () {
  const confirmRoomEnter = async (expectations, hostInfo) => {

  }

  const { invite } = await load(config, confirmRoomEnter)

  console.log('invite:', invite)
  const room = new BreakoutRoom({ invite })

  const hostInvite = await room.ready()
  if (hostInvite) console.log('Give out invite:', hostInvite)

  // send room messages from standard in
  process.stdin.on('data', async (data) => await room.message(data.toString()))

  room.on('peerEntered', (peerKey) => console.log('peer entered the room', peerKey))
  room.on('peerLeft', async (peerKey) => {
    console.log('peer left the room', peerKey)
  })

  room.on('message', async (m) => {
    console.log('remote message recieved', m)
    const transcript = await room.getTranscript()
    console.log('Transcript:', transcript)
  })

  room.installSIGHandlers()
}
run()
