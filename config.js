require('dotenv').config();

const config = {
  username: 'xhila', // your username
  targetUser: 'bradley_dragon', // the channel you're chatting in
  minViewerCount: 45, // mininum number of viewers for bot to be active
  gamblingEnabled: true, // Enable/disable gambling all together (wil still respond to duels)
  message: '!gamble all', // gamble message to send
  minMessageInterval: 10.01, // min minutes between messages sent when online
  maxMessageInterval: 10.25 , // max minutes between message sent when online
  startSlots: true, // Set to true if you want to start slots, or false to disable it
  slotMessage: '!slots all', // slots message to send
  minSlotMessageInterval: 10.51, // Minimum interval in minutes for slots
  maxSlotMessageInterval: 12.25, // Maximum interval in minutes for slots
  // DONT CHANGE BELOW UNLESS YOU KNOW WHAT YOU'RE DOING
  offlineGambling: false, // Enable/disable offline gambling, buggy, keep at false
  minMessageIntervalOffline: 19.99, // min minutes between messages sent when offline
  maxMessageIntervalOffline: 29.99, // max minutes between message sent when offline
  balanceFilePath: 'balance.json',
  balanceLogInterval: 15, // seconds between logging current balance
  viewerCountLogInterval: 15, // seconds between logging viewer count
  password: process.env.OAUTH_CODE, 
};

module.exports = config;