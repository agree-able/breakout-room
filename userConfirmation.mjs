export const confirmRoomEnter = async (expectations, hostInfo) => {
  console.log('We are about to enter a room that you have to agree to join')
  console.log('here are the expectations')
  console.log('', expectations, hostInfo)
  // we should give the user a chance to accept these
  // also if expectations.whoamiRequired, let them know they will be signing and sharing their info
  return { rules: true, reason: true }
}

export const gatherExpectations = async (config) => {
  const expectations = {
    reason: 'We are playing a game of 20 questions. The user is trying to guess an object. The assistant will provide hints and the user will ask yes/no questions to guess the object. The game ends when the user guesses the object or runs out of questions.',
    rules: 'The user can ask yes/no questions to guess the object. The user has 20 questions to guess the object. The user can quit the game at any time by typing "quit". If the user guesses the object, the game ends. If the user runs out of questions, the game ends and the object is revealed.',
    whoamiRequired: config.whoamiRequired || false
  }
  return expectations
}

export const validateParticipant = (acceptance, extraInfo) => {
  console.log('asked to validate', acceptance, extraInfo)
  return { ok: true }
}

