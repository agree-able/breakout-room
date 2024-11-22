#!/usr/bin/env node
import { BreakoutRoom } from '@agree-able/room'

const invite = process.argv[2]

async function run () {
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
