module.exports = {
  targetUser: 'twitch_username',
  username: 'your_username',
  password: process.env.OAUTH_CODE, 
  gamblingEnabled: true, // will still respond to duels
  
  message: '', // message to send
  minMessageInterval: 6.5, // minutes
  maxMessageInterval: 10.5, // minutes
  
  startSlots: false,
  slotMessage: '!slots all',
  slotMessageInterval: 45, // minutes
  
  minViewerCount: 29, // for bot to be active, ignores offlineGambling
  offlineGambling: false,
  minMessageIntervalOffline: 80.5, // minutes
  maxMessageIntervalOffline: 100.5, // minutes

  balanceFilePath: 'balance.json',
  balanceLogInterval: 15, // seconds
  viewerCountLogInterval: 15, // seconds
};
