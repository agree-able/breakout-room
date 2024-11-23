#!/usr/bin/env node
import { BreakoutRoom } from '@agree-able/room'
import { loadInvite, agreeableKeyFromDomain, loadProxyFromKey  } from './loadInvite.mjs'
import rc from 'run-con'
import readline from 'readline'

const config = rc('breakout-room', {})
console.log(config)

async function run () {

  let invite = null
  if (config.domain) {
    const agreeableKey = await agreeableKeyFromDomain(config.domain)
    const proxy = await loadProxyFromKey(agreeableKey)
    const expectations = await proxy.roomExpectations()
    console.log(expectations)
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise(resolve => {
      rl.question('Continue? (Y/n): ', resolve)
    })
    
    rl.close()
    
    if (answer.toLowerCase() !== 'y' && answer !== '') {
      console.log('Aborted')
      process.exit(0)
    }
    
    invite = await proxy.newRoom()
  }
  console.log('invite:', invite)
  const room = new BreakoutRoom({ invite })
  
  // Restore stdin to raw mode after readline
  process.stdin.setRawMode(true)
  process.stdin.setEncoding('utf8')
  process.stdin.resume()
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
