const https = require('https');
const config = require('./config');


function getStreamStatus() {
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
          // console.log(streamData)
          if (streamData.data && streamData.data.length > 0) {
            // Streamer is online
            const viewerCount = streamData.data[0].viewer_count;
            resolve({ online: true, viewerCount });
          } else {
            // Streamer is offline
            
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
}


function getViewerCount() {
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
            // Streamer is online
            const viewerCount = streamData.data[0].viewer_count;
            resolve(viewerCount);
          } else {
            // Streamer is offline
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
}

module.exports = { getStreamStatus, getViewerCount };
