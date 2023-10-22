# YouTube Notify
An npm package that controls when a specified channel publishes a video!

# Installation
``` 
npm install yt-notify
```

# Use
```javascript
const { Notify } = require('yt-notify')
const notify = new Notify();

notify.on('ready', async () => {
  const id = notify.getChannelId('https://www.youtube.com/@example') // Youtube channel url

  // Create the listener
  notify.createListener({channelId: id});
});

// Event for when the video is published
notify.on('newVideo', items => {
  console.log(items);
});
```

#Wiki
...
