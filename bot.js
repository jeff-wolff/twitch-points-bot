// Twitch Gambling Bot: Utilizes tmi.js (a twitch js library), and configures the bot's behavior, 
// It periodically checks the streamer's status and viewer count using the Twitch API. 
// And uses minimum viewer count requirements to determine if the bot is online.
// There's a feature to set different chat message intervals for online and offline gambling.
// There is also a separate chat interval for the "!slots" command
// Tracks the user's current points balance and logs chat interactions. 
// The bot also accepts duels from other Twitch users. 

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const tmi = require('tmi.js');

const config = {  
  targetUser: 'bradley_dragon', // the channel
  
  minViewerCount: 45, // mininum number of viewers for bot to be active
  
  message: '!gamble all', // gamble message to send

  gamblingEnabled: true, // Enable/disable gambling all together (wil still respond to duels)
  minMessageInterval: 10.01, // min minutes between messages sent when online
  maxMessageInterval: 10.25 , // max minutes between message sent when online
  offlineGambling: true, // Enable/disable offline gambling, buggy keep at true
  minMessageIntervalOffline: 19.99, // min minutes between messages sent when offline
  maxMessageIntervalOffline: 29.99, // max minutes between message sent when offline
  startSlots: true, // Set to true if you want to start slots, or false to disable it
  slotMessage: '!slots all', // slots message to send
  minSlotMessageInterval: 10.51, // Minimum interval in minutes for slots
  maxSlotMessageInterval: 12.25, // Maximum interval in minutes for slots
  
  username: 'xhila', // your username
  
  // DONT CHANGE BELOW UNLESS YOU KNOW WHAT YOU'RE DOIN
  balanceFilePath: 'balance.json',
  balanceLogInterval: 15, // seconds between logging current balance
  viewerCountLogInterval: 15, // seconds between logging viewer count
  password: process.env.OAUTH_CODE, 
};

const VIEWER_COUNT_LOG_INTERVAL = config.viewerCountLogInterval;

let currentBalance = 0;
let profit = 0; 
let botEnabled = false;
let wins = 0;
let losses = 0; 

const intervals = {};

// ANSI Color Constants
const COLORS = {
  RESET: "\x1b[0m",       // Reset all formatting
  BOLD: "\x1b[1m",        
  DIM: "\x1b[2m",         
  ITALIC: "\x1b[3m",      
  UNDERLINE: "\x1b[4m",   
  BLINK: "\x1b[5m",       
  REVERSE: "\x1b[7m",     // Reverse background and foreground colors
  HIDDEN: "\x1b[8m",      // (usually same as background)
  STRIKETHROUGH: "\x1b[9m", 
};

const options = {
  options: { debug: false },
  connection: { secure: true, reconnect: true },
  identity: { username: config.username, password: config.password },
  channels: [config.targetUser],
};

const client = new tmi.client(options);

// Call loadBalance to initialize currentBalance, wins, and losses from balance.json
loadBalance();

// Events
client.on('connected', (address, port) => {
  customLog(`Connected to ${address}:${port}`, '#00FF00');

  if (config.gamblingEnabled) {
    customLog(`Sent message to ${config.targetUser}'s chat: ${config.message}`, '#ff00ff'); 
    sendMessage(config.message);
    startGambling();
    if (config.startSlots) {
        startSlots();
    }
    startBalanceLog();
  }
});

client.on('chat', (channel, userstate, message, self) => {
  // customLog(`DEBUG: ${channel}, ${JSON.stringify(user)}, ${msg}, ${self}`, '31');
  const displayName = userstate['display-name'];
  const userColor = userstate['color']; // This is the HEX color code
  const formattedMessage = `${displayName}${COLORS.RESET}: ${message}`;
  customLog(formattedMessage, userColor); // Use user's Twitch color
  if (userstate && userstate.username) {
    const username = userstate.username.toLowerCase(); 
    checkAndAcceptDuel(username, message);
  }
});

client.on('whisper', (from, userstate, message, self) => {
  if (message.includes('Rolled')) {
    const numbers = message.match(/\d+/g);
    const outcome = message.includes('won') ? 'won' : 'lost'; // Detect if the message indicates winning or losing
    if (numbers && numbers.length > 0) {
      const lastNumber = parseInt(numbers[numbers.length - 1], 10);
      if (!isNaN(lastNumber)) {
        // Calculate points earned or lost in this message
        const pointsChange = lastNumber - currentBalance;

        // Update currentBalance and previousBalance
        currentBalance = lastNumber;

        // Update the rolling total based on pointsChange
        profit += pointsChange;

        // Update wins and losses
        if (outcome === 'won') {
          wins++;
        } else if (outcome === 'lost') {
          losses++;
        }

        customLog(`New balance: ${currentBalance.toLocaleString()} points | Total W/L: ${wins}/${losses} | Session Profit: ${profit}`, '#ff00ff');
        customLog(`Gamble outcome: ${outcome}`, outcome === 'won' ? '#00FF00' : '#FF0000'); 
        saveBalance();
      }
    }
  }
});

// Functions
function startBot() {
  if (!botEnabled) {
    customLog(`Bot started`, '#00FF00');
    botEnabled = true;
    client.connect();
  }
}

function stopBot() {
  if (botEnabled) {
    customLog(`Bot stopped`, '#FF0000');
    botEnabled = false;
    client.disconnect();
  }
}

function sendMessage(message) {
  const escapedMessage = `${message} \u{E0000}`;
  client.say(config.targetUser, escapedMessage)
    .then(() => {
      console.log(`Message sent successfully to ${config.targetUser}: ${message}`);
      customLog(`Sent message to ${config.targetUser}'s chat: ${message}`, '#ff00ff'); 
    })
    .catch((err) => {
      console.error(`Error sending message to ${config.targetUser}: ${err.message}`);
      customLog('Error sending message:', '#FF0000');
      console.error(err);
    });
}

function startCountdown(action, message, minInterval, maxInterval, color) {
  getStreamStatus().then(({ online }) => {
          const intervalInSeconds = online ? getRandomInterval(minInterval * 60, maxInterval * 60) : getRandomInterval(minInterval * 60, maxInterval * 60);
          let countdown = Math.floor(intervalInSeconds);

          console.log(`Starting countdown for ${action} at ${countdown} seconds.`);

          clearInterval(intervals[action]); // Ensure no previous interval is running

          intervals[action] = setInterval(() => {
              const minutes = Math.floor(countdown / 60);
              const seconds = countdown % 60;
              // console.log(`[${action.toUpperCase()}] Countdown: ${minutes}m ${seconds}s remaining.`);

              if ((countdown > 10 && countdown % 5 === 0) || countdown <= 10) {
                  customLog(`${minutes}m ${seconds}s until next ${action}`, color);
              }

              if (countdown < 0) {
                  clearInterval(intervals[action]);
                  console.log(`Countdown finished for ${action}. Sending message: ${message}`);
                  sendMessage(message);
                  startCountdown(action, message, minInterval, maxInterval, color); // Restart countdown
              } else {
                countdown -= 1;
              }
          }, 1000);
      })
      .catch((error) => {
          console.error('Error checking streamer status:', error);
      });
}

function startGambling() {
  startCountdown("gamble", config.message, config.minMessageInterval, config.maxMessageInterval, '#ffff00');
}

function startSlots() {
  setTimeout(() => {
      sendMessage(config.slotMessage);
      startCountdown("slots", config.slotMessage, config.minSlotMessageInterval, config.maxSlotMessageInterval, '#00FFFF');
  }, 3000); // Delay to prevent any overlap or conflict
}

function checkAndAcceptDuel(username, message) {
  const lowercaseMsg = message.toLowerCase();

  if (
    username === 'streamlabs' &&
    lowercaseMsg.startsWith(`@${config.username}`) &&
    lowercaseMsg.includes(`wants to duel you for`)
  ) {
    const delay = getRandomInterval(5, 12);

    setTimeout(() => {
      const response = `!accept`;
      client.say(config.targetUser, response);
      customLog(`Responded to duel with ${response}`, '#00FF00');
    }, delay * 1000);
  }
}

function getStreamStatus() {
  const twitchApiEndpoint = `https://api.twitch.tv/helix/streams?user_login=${config.targetUser}`;

  const options = {
    headers: {
      'Client-Id': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${process.env.TWITCH_AUTHORIZATION}`,
    },
  };

  return new Promise((resolve, reject) => {
    https.get(twitchApiEndpoint, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });
      

      response.on('end', () => {
        try {
          const streamData = JSON.parse(data);
          // console.log(streamData)
          if (streamData.data && streamData.data.length > 0) {
            // Streamer is online
            const viewerCount = streamData.data[0].viewer_count;
            resolve({ online: true, viewerCount });
          } else {
            // Streamer is offline
            
            resolve({ online: false });
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function checkStreamerStatus() {
  if (config.offlineGambling) {
    startBot();
    return;
  }

  getStreamStatus()
    .then(({ online, viewerCount }) => {
      if (online) {
        if (viewerCount >= config.minViewerCount) {
          startBot();
        } else {
          stopBot();
        }
      } else {
        stopBot();
      }
    })
    .catch((error) => {
      console.error('Error checking streamer status:', error);
    });
}
setInterval(checkStreamerStatus, 1000);

function getViewerCount() {
  const twitchApiEndpoint = `https://api.twitch.tv/helix/streams?user_login=${config.targetUser}`;

  const options = {
    headers: {
      'Client-Id': process.env.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${process.env.TWITCH_AUTHORIZATION}`,
    },
  };

  return new Promise((resolve, reject) => {
    https.get(twitchApiEndpoint, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const streamData = JSON.parse(data);

          if (streamData.data && streamData.data.length > 0) {
            // Streamer is online
            const viewerCount = streamData.data[0].viewer_count;
            resolve(viewerCount);
          } else {
            // Streamer is offline
            resolve(0);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function logViewerCount() {
  getViewerCount()
    .then((viewerCount) => {
      const color = viewerCount > 0 ? '#00FF00' : '#FF0000';
      customLog(`Viewer Count: ${viewerCount}`, color); // Log the viewer count
    })
    .catch((error) => {
      console.error('Error checking viewer count:', error);
    });
}
setInterval(logViewerCount, VIEWER_COUNT_LOG_INTERVAL * 1000);

// Balance functions
function loadBalance() {
  try {
    const data = fs.readFileSync(config.balanceFilePath, 'utf8');
    const parsedData = JSON.parse(data);
    if (parsedData.balance !== undefined) {
      currentBalance = parsedData.balance;
      wins = parsedData.wins || 0; // Load wins from the file or initialize to 0
      losses = parsedData.losses || 0; // Load losses from the file or initialize to 0
      customLog(`Loaded balance: ${currentBalance.toLocaleString()} points | Total W/L: ${wins}/${losses}`, '#ff00ff');
    }
  } catch (err) {
    console.error('Error loading balance:', err);
  }
}

function saveBalance() {
  const data = JSON.stringify({ balance: currentBalance, wins, losses });
  fs.writeFileSync(config.balanceFilePath, data, 'utf8');
  customLog(`Saved balance: ${currentBalance.toLocaleString()} points | Total W/L: ${wins}/${losses}`, '#ff00ff');
}

function startBalanceLog() {
  setInterval(() => {
    const winLossPercentage =  ((wins / (wins + losses)) * 100).toFixed(2);

    customLog(`${currentBalance.toLocaleString()} | Total W/L: ${wins}/${losses} | Total W/L %: ${winLossPercentage}% | Session Profit: ${profit}`, '#ff00ff'); 
  }, config.balanceLogInterval * 1000);
}

process.on('SIGINT', () => {
  // App termination to save the balance
  saveBalance();
  process.exit();
});

// Utility functions
function customLog(message, hexColor = "#FFFFFF") { 
  let currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let timeColor = "\x1b[90m"; // ANSI code for dark gray
  let colorPrefix = ``;
  if (hexColor) {
      const { r, g, b } = hexToRgb(hexColor) || { r: 255, g: 255, b: 255 }; 
      colorPrefix = `\x1b[38;2;${r};${g};${b}m`;
  }
  console.log(`${timeColor}${currentTime} ${colorPrefix}${message}${COLORS.RESET}`);
}

function hexToRgb(hex) {
  if (!hex) return null;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getRandomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

