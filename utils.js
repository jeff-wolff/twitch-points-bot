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

function customLog(message, hexColor = "#FFFFFF") { 
  try {    
    let currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let timeColor = "\x1b[90m"; // ANSI code for dark gray
    let colorPrefix = ``;
    if (hexColor) {
        const { r, g, b } = hexToRgb(hexColor) || { r: 255, g: 255, b: 255 }; 
        colorPrefix = `\x1b[38;2;${r};${g};${b}m`;
    }
    console.log(`${timeColor}${currentTime} ${colorPrefix}${message}${COLORS.RESET}`);
  } catch (err) {
    console.error("Failed to log message:", err);
  }
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

module.exports = { customLog, hexToRgb, getRandomInterval, COLORS };
