require('dotenv').config();
const config = require('./config');
const { loadBalance, saveBalance, startBalanceLog } = require('./balanceManager');
const { customLog, getRandomInterval, COLORS } = require('./utils');
const tmi = require('tmi.js');
const twitchManager = require('./twitchManager');

let botEnabled = false;

const balanceInfo = {
  currentBalance: 0,
  wins: 0,
  losses: 0,
  profit: 0
};

let intervals = {};

const options = {
  options: { debug: false },
  connection: { secure: true, reconnect: true },
  identity: { username: config.username, password: config.password },
  channels: [config.targetUser],
};

const client = new tmi.client(options);

// Call loadBalance to initialize currentBalance, wins, and losses from balance.json
loadBalance(balanceInfo);

// Events
client.on('connected', (address, port) => {
  customLog(`Connected to ${address}:${port}`, '#00FF00');

  if (config.gamblingEnabled || config.offlineGambling) {    
    startGambling();
    if (config.startSlots) {
        startSlots();
    }
    startBalanceLog(balanceInfo);
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
        const pointsChange = lastNumber - balanceInfo.currentBalance;

        // Update currentBalance and previousBalance
        balanceInfo.currentBalance = lastNumber;

        // Update the rolling total based on pointsChange
        balanceInfo.profit += pointsChange;

        // Update wins and losses
        if (outcome === 'won') {
          balanceInfo.wins++;
        } else if (outcome === 'lost') {
          balanceInfo.losses++;
        }

        customLog(`New balance: ${balanceInfo.currentBalance.toLocaleString()} points | Total W/L: ${balanceInfo.wins}/${balanceInfo.losses} | Session Profit: ${balanceInfo.profit.toLocaleString()}`, '#ff00ff');
        customLog(`Gamble outcome: ${outcome}`, outcome === 'won' ? '#00FF00' : '#FF0000');
        saveBalance(balanceInfo);
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

    // Clear all running intervals
    Object.keys(intervals).forEach(action => {
      clearInterval(intervals[action]);
      customLog(`Cleared interval for ${action}`, '#FF0000');
    });
    intervals = {};

  }
}
setInterval(() => twitchManager.checkStreamerStatus(config, startBot, stopBot), 1000);
setInterval(() => twitchManager.logViewerCount(config), config.viewerCountLogInterval * 1000);

function sendMessage(message) {
  const escapedMessage = `${message} \u{E0000}`;
  customLog(`Sending message to ${config.targetUser}'s chat: ${message}`, '#ff00ff'); 
  client.say(config.targetUser, escapedMessage)
    .then(() => {
      customLog(`Message sent successfully to ${config.targetUser}'s chat: ${message}`, '#ff00ff'); 
    })
    .catch((err) => {
      console.error(`Error sending message to ${config.targetUser}: ${err.message}`);
      customLog('Error sending message:', '#FF0000');
      console.error(err);
    });
}

function startCountdown(action, message, minInterval, maxInterval, color) {
  twitchManager.getStreamStatus(config).then(({ online }) => {
          const intervalInSeconds = online ? getRandomInterval(minInterval * 60, maxInterval * 60) : getRandomInterval(minInterval * 60, maxInterval * 60);
          let countdown = Math.floor(intervalInSeconds);

          console.log(`Starting countdown for ${action} at ${countdown} seconds.`);

          clearInterval(intervals[action]); // Ensure no previous interval is running

          intervals[action] = setInterval(() => {
              const minutes = Math.floor(countdown / 60);
              const seconds = countdown % 60;

              if ((countdown > 10 && countdown % 10 === 0) || (countdown <= 10 && countdown > 0)) {
                  customLog(`[${action}] ${minutes}m ${seconds}s`, color);
              }

              if (countdown < 0) {
                  clearInterval(intervals[action]);
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
  sendMessage(config.message);
  startCountdown("gamble", config.message, config.minMessageInterval, config.maxMessageInterval, '#ffff00');
}

function startSlots() {
  setTimeout(() => {      
      sendMessage(config.slotMessage);
      startCountdown("slots", config.slotMessage, config.minSlotMessageInterval, config.maxSlotMessageInterval, '#0000FF');
  }, 3000); // Delay to prevent any overlap or conflict with Gambling
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

process.on('SIGINT', () => {
  // App termination to save the balance
  saveBalance(balanceInfo);
  process.exit();
});
