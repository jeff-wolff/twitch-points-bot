const config = {

  username: 'xhila', // your username
  targetUser: 'bradley_dragon', // the channel you're chatting in
  
  minViewerCount: 20, // mininum number of viewers for bot to be active
  gamblingEnabled: true, // Enable/disable gambling all together (wil still respond to duels)
  offlineGambling: false, // Enable/disable gambling while streamer is offline

  message: '!gamble all', // gamble message to send
  minMessageInterval: 5.05, // min minutes between messages sent when online
  maxMessageInterval: 7.25, // max minutes between message sent when online

  startSlots: false, // Set to true if you want to start slots, or false to disable it
  slotMessage: '!slots all', // slots message to send
  minSlotMessageInterval: 7.05, // Minimum interval in minutes for slots
  maxSlotMessageInterval: 25.25, // Maximum interval in minutes for slots


  // DONT CHANGE BELOW UNLESS YOU KNOW WHAT YOU'RE DOING
  balanceLogInterval: 60, // seconds between logging current balance
  viewerCountLogInterval: 30, // seconds between logging viewer count
  balanceFilePath: 'balance.json',
  password: process.env.OAUTH_CODE, 

};

module.exports = config;