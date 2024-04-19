const fs = require('fs');
const config = require('./config');
const { customLog } = require('./utils');

function loadBalance(balanceInfo) {
  try {
    const data = fs.readFileSync(config.balanceFilePath, 'utf8');
    const parsedData = JSON.parse(data);
    if (parsedData.balance !== undefined) {
      balanceInfo.currentBalance = parsedData.balance;
      balanceInfo.wins = parsedData.wins || 0;
      balanceInfo.losses = parsedData.losses || 0;
      customLog(`Loaded balance: ${balanceInfo.currentBalance.toLocaleString()} points | Total W/L: ${balanceInfo.wins}/${balanceInfo.losses}`, '#ff00ff');
    }
  } catch (err) {
    console.error('Error loading balance:', err);
  }
}

function saveBalance(balanceInfo) {
  const data = JSON.stringify({ balance: balanceInfo.currentBalance, wins: balanceInfo.wins, losses: balanceInfo.losses });
  fs.writeFileSync(config.balanceFilePath, data, 'utf8');
  customLog(`Saved balance: ${balanceInfo.currentBalance.toLocaleString()} points | Total W/L: ${balanceInfo.wins}/${balanceInfo.losses}`, '#ff00ff');
}

function startBalanceLog(balanceInfo) {
  setInterval(() => {
    const totalGames = balanceInfo.wins + balanceInfo.losses;
    const winLossPercentage = totalGames === 0 ? 0 : ((balanceInfo.wins / totalGames) * 100).toFixed(2);

    customLog(`${balanceInfo.currentBalance.toLocaleString()} | Total W/L: ${balanceInfo.wins}/${balanceInfo.losses} | Total W/L %: ${winLossPercentage}% | Session Profit: ${balanceInfo.profit}`, '#ff00ff');
  }, config.balanceLogInterval * 1000);
}

module.exports = { loadBalance, saveBalance, startBalanceLog };
