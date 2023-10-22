# YouTube Notify

An npm package that run codes when a specified channel publishes a video.

# Installation

```
npm install yt-notifier
```

# Use

```javascript
const { Notify } = require("yt-notifier");
const notify = new Notify();

notify.on("ready", async () => {
  const id = notify.getChannelId("https://www.youtube.com/@example"); // Youtube channel url

  // Create the listener
  notify.createListener({ channelId: id });
});

// Event for when the video is published
notify.on("newVideo", (items) => {
  console.log(items);
});
```

# Documentation
<details><summary>Events</summary>

## Ready
This event is only active when instance is ```ready```.

### Use
```javascript
notify.on('ready', (i) => {
  ...
});
```

</details>
