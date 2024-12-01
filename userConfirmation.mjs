import { text, confirm, select, log, note } from '@clack/prompts'
import pc from 'picocolors'
import fs from 'fs'
import path from 'path'
import os from 'os'

function looksLikePGPPrivateKey(text) {
  const pgpHeader = '-----BEGIN PGP PRIVATE KEY BLOCK-----'
  const pgpFooter = '-----END PGP PRIVATE KEY BLOCK-----'
  return text.includes(pgpHeader) && text.includes(pgpFooter)
}

function expandTilde(filePath) {
  if (filePath[0] === '~') {
    return path.join(os.homedir(), filePath.slice(1))
  }
  return filePath
}

const joinRoomValidate = async (config) => {
  const { invite, agreeableKey, domain } = config
  // need one of these
  if (!invite && !agreeableKey && !domain) {
    const howToConnect = await select({
      message: 'how to bootstrap peer connection?',
      options: [
        { value: 'agreeableKey', label: 'use agreeableKey given to you', hint: 'reusable, but has terms to join' },
        { value: 'invite', label: 'use a one time invite code' },
        { value: 'domain', lable: 'use a domain txt lookup to find agreeable key' }
      ]
    })
    const value = await text({
      message: `Please enter the ${howToConnect}`,
      initialValue: '',
      validate (value) {
        if (value.length === 0) return 'Value is required!'
      }
    })
    config[howToConnect] = value
  }
}

const startRoomManagerValidate = async (config) => {

}

const simpleRoomValidate = async (config) => {

}

export const validateAndUpdateConfig = async (config) => {
  const { invite, agreeableKey, domain } = config
  const joinRoom = invite || agreeableKey || domain

  const { seed } = config
  const startRoomManager = seed

  if (joinRoom && !startRoomManager) return await joinRoomValidate(config)
  if (startRoomManager && !joinRoom) return await startRoomManagerValidate(config)

  // if none or both, lets clarify with the user
  const projectType = await select({
    message: 'What are you trying to do?',
    options: [
      { value: 'joinRoom', label: 'Join an existing room' },
      { value: 'startRoomManager', label: 'Start a room manager', hint: 'host many rooms/connections' },
      { value: 'simpleRoom', label: 'Start a simple room' }
    ]
  })
  if (projectType === 'joinRoom') return await joinRoomValidate(config)
  if (projectType === 'startRoomManager') return await startRoomManagerValidate(config)
  return await simpleRoomValidate(config)
}

export const confirmRoomEnter = async (config, expectations, hostInfo) => {
  log.step('We are about to enter a room that you have to agree to join')
  // log.info(`${pc.bold('room reason:')} ${pc.dim(expectations.reason)}`)
  note(expectations.reason, `room reason`)
  const reason = await confirm({
    message: 'Do you agree to the room reason?'
  })
  // log.step(`${pc.bold('room rules:')} ${pc.dim(expectations.rules)}`)
  note(expectations.rules, `room rules`)
  const rules = await confirm({
    message: 'Do you agree to the room rules?'
  })

  if (expectations.whoamiRequired) {
    if (!config.keybaseUsername) {
      config.keybaseUsername = await text({
        message: `Enter your keybase username. Host wants to verify you.`,
        validate (value) {
          if (value.length === 0) return 'Value is required!'
        }
      })
    }
    if (!config.privateKeyArmored && !config.privateKeyArmoredFile) {
      const privateKeyArmoredLocation = await select({
        message: 'To sign your verification locally, lest user your pgp private key',
        options: [
          { value: 'file', label: 'Select a File' },
          { value: 'paste', label: 'Paste it in' },
        ]
      })

      if (privateKeyArmoredLocation === 'file') {
        config.privateKeyArmoredFile = await text({
          message: 'Enter the path to your PGP private key file',
          placeholder: '~/keys/private.key',
          validate(value) {
            if (value.length === 0) return 'Value is required!'
            const expandedPath = expandTilde(value)
            if (!fs.existsSync(expandedPath)) {
              return 'File does not exist!'
            }
            try {
              const content = fs.readFileSync(expandedPath, 'utf8')
              if (!looksLikePGPPrivateKey(content)) {
                return 'File does not appear to be a PGP private key!'
              }
            } catch (err) {
              return 'Unable to read file!'
            }
          }
        })
      } else if (privateKeyArmoredLocation === 'paste') {
        config.privateKeyArmored = await text({
          message: 'Paste your PGP private key',
          validate(value) {
            if (value.length === 0) return 'Value is required!'
            if (!looksLikePGPPrivateKey(value)) {
              return 'Text does not appear to be a PGP private key!'
            }
          }
        })
      }

    }
  }

  return { rules, reason }
}

export const gatherExpectations = async (config) => {
  const reason = config.meaning || await text({
    message: 'Give an explination of what will be accomplished in the room?',
    placeholder: 'We are playing 20 questions',
    initialValue: '',
    validate (value) {
      if (value.length === 0) return 'Value is required!'
    }
  })
  const rules = config.rules || await text({
    message: 'What are the room rules?',
    placeholder: 'No profanity',
    initialValue: '',
    validate (value) {
      if (value.length === 0) return 'Value is required!'
    }
  })
  const whoamiRequired = config.whoamiRequired || await confirm({
    message: 'Do you need participants to validate their identity with keybase?'
  })
  const expectations = { reason, rules, whoamiRequired }

  return expectations
}

export const validateParticipant = async (acceptance, extraInfo) => {
  const ok = await confirm({
    message: 'Allow the participant to enter?'
  })
  return { ok }
}
