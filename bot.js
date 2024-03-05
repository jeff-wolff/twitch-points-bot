require('dotenv').config();
const COLORS = require('./colors');
const config = require('./config');
const { getStreamStatus, getViewerCount } = require('./twitchApi');
const { customLog, getRandomInterval } = require('./utilities');

const fs = require('fs');
const tmi = require('tmi.js');

const MIN_INTERVAL = config.minMessageInterval * 60;
const MAX_INTERVAL = config.maxMessageInterval * 60;
const MIN_INTERVAL_OFFLINE = config.minMessageIntervalOffline * 60;
const MAX_INTERVAL_OFFLINE = config.maxMessageIntervalOffline * 60;
const VIEWER_COUNT_LOG_INTERVAL = config.viewerCountLogInterval;

// Bot state
let currentBalance = 0;
let profit = 0; 
let botEnabled = false;
let wins = 0;
let losses = 0; 

// tmi.js
const options = {
  options: { debug: false },
  connection: { secure: true, reconnect: true },
  identity: { username: config.username, password: config.password },
  channels: [config.targetUser],
};

const client = new tmi.client(options);

// Call loadBalance to initialize currentBalance, wins, and losses
loadBalance();

// Events
client.on('connected', (address, port) => {
  customLog(`Connected to ${address}:${port}`, COLORS.GREEN);

  if (config.gamblingEnabled) {
    customLog(`Sent message to ${config.targetUser}'s chat: ${config.message}`, COLORS.MAGENTA); 
    sendMessage(config.message);
    startGambling();
    if (config.startSlots) {
      startSlots();
    }
    startBalanceLog();
  }
});

client.on('chat', (channel, user, msg, self) => {
  // Log the params
  // customLog(`DEBUG: ${channel}, ${JSON.stringify(user)}, ${msg}, ${self}`, '31');
  const formattedMessage = `[${new Date().toLocaleTimeString()}] <${user['display-name']}>: ${msg}`;
  console.log(formattedMessage); 

  if (user && user.username) {
    const username = user.username.toLowerCase(); 
    checkAndAcceptDuel(username, msg);
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

        customLog(`New balance: ${currentBalance.toLocaleString()} points | Total W/L: ${wins}/${losses} | Profit: ${profit}`, COLORS.MAGENTA);
        customLog(`Gamble outcome: ${outcome}`, outcome === 'won' ? COLORS.GREEN : COLORS.RED); 
        saveBalance();
      }
    }
  }
});

// Functions
function startBot() {
  if (!botEnabled) {
    customLog(`Bot started`, COLORS.GREEN);
    botEnabled = true;
    client.connect();
  }
}

function stopBot() {
  if (botEnabled) {
    customLog(`Bot stopped`, COLORS.RED);
    botEnabled = false;
    client.disconnect();
  }
}

function sendMessage(message) {
  const escapedMessage = `${message} \u{E0000}`;
  client.say(config.targetUser, escapedMessage)
    .then(() => {
      customLog(`Sent message to ${config.targetUser}'s chat: ${message}`, COLORS.MAGENTA); 
    })
    .catch((err) => {
      customLog('Error sending message:', COLORS.RED);
      console.error(err);
    });
}

function startGambling() {
  let randomInterval;
  getStreamStatus()
    .then(({ online }) => {
      if (online) {
        randomInterval = getRandomInterval(MIN_INTERVAL, MAX_INTERVAL);
      } else {
        randomInterval = getRandomInterval(MIN_INTERVAL_OFFLINE, MAX_INTERVAL_OFFLINE);
      }
      let countdown = randomInterval;

      const countdownInterval = setInterval(() => {
        const minutes = Math.floor(countdown / 60);
        const seconds = countdown % 60;

        if (!botEnabled) {
          clearInterval(countdownInterval);
        }

        if (countdown % 5 === 0 || countdown <= 10) {
          customLog(`${minutes}m ${seconds}s`, COLORS.DIM, COLORS.YELLOW);
        }
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          sendMessage(config.message);
          startGambling();
        }
      }, 1000);
    })
    .catch((error) => {
      console.error('Error checking streamer status:', error);
    });
}

function startSlots() {
    customLog(`Starting Slots...`, COLORS.GREEN);

    setTimeout(() => {
      sendMessage(config.slotMessage);
    }, 4000);

    let slotInterval = config.slotMessageInterval * 60 * 1000; // Convert minutes to milliseconds

    if (!botEnabled) {
      clearInterval(countdownInterval);
    }

    const countdownInterval = setInterval(() => {
      if (botEnabled && config.gamblingEnabled) {
        const minutes = Math.floor(slotInterval / 60000); // Convert milliseconds to minutes
        const seconds = ((slotInterval % 60000) / 1000).toFixed(0); // Calculate remaining seconds
        customLog(`${minutes}m ${seconds}s`, COLORS.DIM, COLORS.BLUE);

        if (slotInterval <= 0) {
          customLog(`Sending slot message: ${config.slotMessage}`, COLORS.BLUE);
          sendMessage(config.slotMessage);
          slotInterval = config.slotMessageInterval * 60 * 1000;
        }
        slotInterval -= 1000;
      }
    }, 1000);
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
      customLog(`Responded to duel with ${response}`, COLORS.GREEN);
    }, delay * 1000);
  }
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

function logViewerCount() {
  getViewerCount()
    .then((viewerCount) => {
      const color = viewerCount > 0 ? COLORS.GREEN : COLORS.RED;
      customLog(`Viewer Count: ${viewerCount}`, COLORS.DIM, color); // Log the viewer count
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
      customLog(`Loaded balance: ${currentBalance.toLocaleString()} points | Total W/L: ${wins}/${losses}`, COLORS.MAGENTA);
    }
  } catch (err) {
    console.error('Error loading balance:', err);
  }
}

function saveBalance() {
  const data = JSON.stringify({ balance: currentBalance, wins, losses });
  fs.writeFileSync(config.balanceFilePath, data, 'utf8');
  customLog(`Saved balance: ${currentBalance.toLocaleString()} points | Total W/L: ${wins}/${losses}`, COLORS.MAGENTA);
}

function startBalanceLog() {
  setInterval(() => {
    const winLossPercentage =  ((wins / (wins + losses)) * 100).toFixed(2);

    customLog(`${currentBalance.toLocaleString()} | Total W/L: ${wins}/${losses} | Total W/L %: ${winLossPercentage}%`, COLORS.MAGENTA); 
  }, config.balanceLogInterval * 1000);
}

// Save the balance on app termination
process.on('SIGINT', () => {
  saveBalance();
  process.exit();
});