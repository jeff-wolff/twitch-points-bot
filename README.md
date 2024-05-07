# twitch-points-bot
Utilizes tmi.js (a twitch js library) for messaging and Twitch's API (for checking stream status & viewers).

### 1. Install dependences
`npm install`


### 2. Create .env file
```
TWITCH_CLIENT_ID=
OAUTH_CODE=oauth:  
TWITCH_AUTHORIZATION=
```

### 3. Create Twitch application
Create application on https://dev.twitch.tv/ 

Inside your `.env` fill in `TWITCH_CLIENT_ID` from your application.

#### 4. Get OAUTH_CODE 
Use https://twitchapps.com/tmi/ to generate an `OAUTH_CODE`

__*Make sure you are logged into the Twitch account that you want to use as the bot.*__



#### 5. Get TWITCH_AUTHORIZATION
Replace [TWITCH_CLIENT_ID] and [YOUR SECRET KEY] with details from your application

and run the command below into a terminal window to receive your `TWITCH_AUTHORIZATION` 
```
curl -X POST 'https://id.twitch.tv/oauth2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'client_id=[TWITCH_CLIENT_ID]&client_secret=[YOUR SECRET KEY]&grant_type=client_credentials'
```

### 6. Edit config.js
```
  username: 'your_username',
  targetUser: 'channel_username',
  message: '!gamble all', // message to send
  slotMessage: '!slots all', // alt message to send
```

### 7. Start bot
`node bot.js`
