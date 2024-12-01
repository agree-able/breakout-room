# breakout-room

A fully-featured implementation of [@agreeable-room/room](https://github.com/ryanramage/agreeable-room) demonstrating secure peer-to-peer chat rooms with identity verification. Perfect for studying how to build p2p applications or for direct use in your projects.

## Quick Start

```bash
npx breakout-room
```

The CLI includes an interactive menu system that guides you through all available options and configurations.

## Usage Modes

### 1. Start a Room Manager
Create a hub for hosting multiple rooms with configurable:
- Room purpose and rules
- Identity verification requirements (Keybase integration)
- Automatic or manual participant validation
- Persistent configuration via JSON

Example starting a room manager:
```bash
npx breakout-room --mode=roomManager --reason="Code Review Sessions" --rules="Professional conduct"
```

### 2. Join an Existing Room
Connect to an existing room using one of these methods:
- **agreeableKey**: A reusable connection key with room entry requirements
- **domain**: Lookup room details via DNS TXT record
- **invite**: One-time invite code

Example joining with domain:
```bash
npx breakout-room --mode=join --domain=example.com
```

### 3. Simple Room
Quick setup for basic chat functionality without advanced features.

## DNS Integration

When running a room manager, you'll receive an `agreeableKey`. To allow easy discovery, add it to your domain's DNS:

1. Create a TXT record for: `_breakoutroom.yourdomain.com`
2. Set the value to: `key=YOUR_AGREEABLE_KEY`

Users can then connect using just your domain:
```bash
npx breakout-room --domain=yourdomain.com
```

## Configuration

The CLI's menu system helps discover and configure all options including:
- Room purpose and rules
- Identity verification (Keybase)
- Participant validation
- Connection methods
- Persistent settings

Save configurations to reuse:
```bash
npx breakout-room --config=myroom.json
```

## Examples
- [Basic CLI Implementation](cli.mjs)
- [AI Bot Integration](https://github.com/ryanramage/breakout-room-bot)

## Security Features
- Keybase identity verification
- Domain ownership validation
- Configurable entry requirements
- Participant agreement tracking


