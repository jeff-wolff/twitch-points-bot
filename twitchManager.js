const https = require('https');
const { customLog } = require('./utils'); 

const twitchManager = {
  getStreamStatus: function (config) {
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
              const viewerCount = streamData.data[0].viewer_count;
              resolve({ online: true, viewerCount });
            } else {
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
  },

  checkStreamerStatus: function (config, startBot, stopBot) {
    this.getStreamStatus(config)
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
  },

  getViewerCount: function (config) {
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
              const viewerCount = streamData.data[0].viewer_count;
              resolve(viewerCount);
            } else {
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
  },

  logViewerCount: function (config) {
    this.getViewerCount(config)
      .then((viewerCount) => {
        const color = viewerCount > 0 ? '#00FF00' : '#FF0000';
        customLog(`Viewer Count: ${viewerCount}`, color);
      })
      .catch((error) => {
        console.error('Error checking viewer count:', error);
      });
  }
};

module.exports = twitchManager;
