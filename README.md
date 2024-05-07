# twitch-points-bot
Utilizes tmi.js (a twitch js library) for messaging and Twitch's API to check stream status & viewers.

### Install dependences
`npm install`

### Create and configure .env file
```
OAUTH_CODE=oauth:  
TWITCH_CLIENT_ID=
TWITCH_AUTHORIZATION=
```

Get OAUTH_CODE 

Use: https://twitchapps.com/tmi/ to generate

Create application on https://dev.twitch.tv/

Get TWITCH_AUTHORIZATION:
```
curl -X POST 'https://id.twitch.tv/oauth2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'client_id=[TWITCH_CLIENT_ID]&client_secret=[YOUR SECRET KEY]&grant_type=client_credentials'
```

### Edit config.js
```
  username: 'your_username',
  targetUser: 'channel_username',
  message: '!gamble all', // message to send
  slotMessage: '!slots all', // alt message to send
```

### Start bot
`node bot.js`
