module.exports = {
  username: 'your_username',
  targetUser: 'channel_username',
  message: '!gamble all', // message to send
  
  // DONT CHANGE BELOW
  // UNLESS YOU KNOW WHAT YOU'RE DOING
  password: process.env.OAUTH_CODE, // get your oauth code and publish it to the .env

  minViewerCount: 10, // mininum number of viewers for bot to be active
  gamblingEnabled: true, // Enable/disable gambling all together (wil still respond to duels)
  offlineGambling: true, // Enable/disable offline gambling, buggy keep at true
  
  minMessageInterval: 6.5, // min minutes between messages sent when online
  maxMessageInterval: 10.5, // max minutes between message sent when online
  minMessageIntervalOffline: 60.5, // min minutes between messages sent when offline
  maxMessageIntervalOffline: 64.5, // max minutes between message sent when offline

  startSlots: false, // Set to true if you want to start slots, or false to disable it
  slotMessage: '!slots all',
  slotMessageInterval: 8.5, // Interval in minutes for sending the slot message

  balanceFilePath: 'balance.json', // used to log your point balance
  balanceLogInterval: 15, // seconds between logging current balance
  viewerCountLogInterval: 15, // seconds between logging viewer count

};
