const COLORS = require('./colors');

function customLog(message, ...colors) {
  const colorCodes = colors.join('');
  console.log(`[${new Date().toLocaleTimeString()}] ${colorCodes}${message}${COLORS.RESET}`);
}

function getRandomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { customLog, getRandomInterval };
