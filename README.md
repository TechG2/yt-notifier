# YouTube Notify

An npm package that run codes when a specified channel publishes a video.

# Summary

1. [ Installation. ](#installation)
2. [ Use. ](#use)
3. [ Change Logs. ](#change)
4. [ Documentation. ](#documentation)
   - [ Inizialization. ](#inizialization)
   - [ Function. ](#functions)
   - [ Events. ](#events)
5. [Extensions.](#extensions)
   - [Twitch.](#twitch).

<a name='installation'></a>

# Installation

```
npm install yt-notifier
```

<a name='use'></a>

# Use

```javascript
const { Notify } = require("yt-notifier");
const notify = new Notify({
  apiKey: "Your youtube ApiKey",
});

notify.on("ready", async () => {
  const id = await notify.getChannelId("https://www.youtube.com/@example"); // Youtube channel url

  // Create the listener
  await notify.createListener({ channelId: id });
});

// Event for when the video is published
notify.on("newVideo", (items) => {
  console.log(items);
});
```

<a name='change'></a>

# Change Logs

## v2.0.0: (last-release)

### General +

- Added extension option when creating constructor.

### Youtube +

- Added more results than when a video is uploaded (will soon be done with the Twitch extension too).
- Added apiKey option when creating constructor.
- Fixed a bug with the newVideo events.

### Twitch +

- Added TwitchExtension constructor.
- Added client id and token option to the constructor.
- Added createListener() and stopListener() function.
- Added ready, create, delete, isLive events.

---

<a name='documentation'></a>

# Documentation

<a name='inizialization'></a>

## Inizialization

```javascript
const { Notify } = require("yt-notifier");
const notify = new Notify({
  apiKey: "Your youtube ApiKey",
});
```

<a name='functions'></a>

## Functions

The functions that can be used with this package.

### getChannelId()

Gets the channel id from url **delete** event.

#### Use

```javascript
const channelId = await notify.getChannelId("https://www.youtube.com/@example");
```

### Returns

```
channelId
```

### createListener()

Creates a listener and active **create**, when the listener is create, and **newVideo**, when the specified channel upload a video, events.

#### Use

```javascript
await notify.createListener({ channelId: id });
```

### stopListener()

Stops a listener and active **delete** event.

#### Use

```javascript
await notify.stopListener({ channelId: id });
```

<a name='events'></a>

## Events

The events that can be actived.

---

<details><summary>Ready</summary>

---

This event is only active when instance is **ready**.

### Use

```javascript
notify.on('ready', (i) => {
  ...
});
```

### Returns

```
currentInstance
```

### Example

```javascript
const { Notify } = require("yt-notifier");
const notify = new Notify({
  apiKey: "Your youtube ApiKey",
});

notify.on("ready", async (i) => {
  console.log(i);
});
```

</details>

---

<details><summary>Create</summary>

---

This event is activated when a new listener is **created**.

### Use

```javascript
notify.on('create', (channelId, id) => {
  ...
});
```

### Returns

```
channelId, currentInstance
```

### Example

```javascript
const { Notify } = require('yt-notifier');
const notify = new Notify({
   apiKey: "Your youtube ApiKey"
});

...

notify.on('create', (channelId, i) => {
  console.log(channelId);
});
```

</details>

---

<details><summary>Delete</summary>

---

This event is activated when a listener is **deleted**.

### Use

```javascript
notify.on('delete', (channelId, i) => {
  ...
});
```

### Returns

```
channelId, currentInstance
```

### Example

```javascript
const { Notify } = require('yt-notifier');
const notify = new Notify({
   apiKey: "Your youtube ApiKey"
});

...

notify.on('delete', (channelId, i) => {
  console.log(channelId);
});
```

</details>

---

<details><summary>newVideo</summary>

---

This event is activated when a cahnnel publish a **new video**.

### Use

```javascript
notify.on('newVideo', (items) => {
  ...
});
```

### Returns

```
{
   id: '{videoId}',
   title: '{videoTitle}',
   description: '{videoDescription}',
   link: '<videoUrl>',
   releaed: '<releaseDate>',
   thumbnails: {
      default: '<thumbnailUrl>',
      medium: '<thumbnailUrl>',
      high: '<thumbnailUrl>',
      standard: '<thumbnailUrl>',
      maxres: '<thumbnailUrl>',
   },
   statistics: {
      viewCount: '<viewsNumber>',
      likeCount: '<likeCount>',
      favoriteCount: '<favoriteCount>',
      commentCount: '<commentsNumber>'
   },
   author: {
      link: '<channelUrl>',
      name: '<channelName>',
      description: '<channelDescription>',
      avatars: {
         default: '<avatarUrl>'
         medium: '<avatarUrl>',
         high: '<avatarUrl>',
      },
      subscribers: '<subscribersCount>',
      videoCount: '<videoCount>',
      views: '<viewsNumber>',
   }
}
```

### Example

```javascript
const { Notify } = require('yt-notifier');
const notify = new Notify({
   apiKey: "Your youtube ApiKey"
});

...

notify.on('newVideo', (items) => {
  console.log(items);
});
```

</details>

---

<a name='extensions'></a>

# Extensions

<a name='twitch'></a>

## Twitch

### Use

```javascript
const { Notify, TwitchExtension } = require("yt-notify");
const notify = new Notify({
  apiKey: "Your youtube ApiKey",
  extensions: {
    twitch: new TwitchExtension({
      clientId: "Twitch client id",
      token: "Twitch token id",
    }),
  },
});
const twitch = notify.twitch;
```

### Function

#### createListener()

Creates a listener and active **create**, when the listener is create, and **newVideo**, when the specified channel upload a video, events.

##### Use

```javascript
await twitch.createListener({ channel: channelName });
```

#### stopListener()

Stops a listener and active **delete** event.

##### Use

```javascript
await twitch.stopListener({ channel: channelName });
```

### Events

The events that can be actived with this extension.

---

<details><summary>Ready</summary>

---

This event is only active when instance is **ready**.

### Use

```javascript
twitch.on('ready', (i) => {
  ...
});
```

### Returns

```
currentInstance
```

### Example

```javascript
const { Notify, TwitchExtension } = require("yt-notify");
const notify = new Notify({
  apiKey: "Your youtube ApiKey",
  extensions: {
    twitch: new TwitchExtension({
      clientId: "Twitch client id",
      token: "Twitch token id",
    }),
  },
});
const twitch = notify.twitch;

twitch.on("ready", async (i) => {
  console.log(i);
});
```

</details>

---

<details><summary>Create</summary>

---

This event is activated when a new listener is **created**.

### Use

```javascript
twitch.on('create', (channelId, id) => {
  ...
});
```

### Returns

```
{
   id: '<channelId>',
   login: '<channelUsername>',
   display_name: '<channelName>',
   broadcaster_type: '<brodcastType>',
   description: '<channelDescription>',
   profile_image_url: '<profileImage>',
   offline_image_url: '<offlineImage>',
   view_count: <viewCount>,
   created_at: '<creationTime>'
},
currentInstance
```

### Example

```javascript
const { Notify, TwitchExtension } = require("yt-notify");
const notify = new Notify({
   apiKey: "Your youtube ApiKey",
   extensions: {
      twitch: new TwitchExtension({
         clientId: "Twitch client id",
         token: "Twitch token id",
      })
   }
});
const twitch = notify.twitch;

...

twitch.on('create', (streamerInfo, i) => {
  console.log(streamerInfo);
});
```

</details>

---

<details><summary>Delete</summary>

---

This event is activated when a listener is **deleted**.

### Use

```javascript
twitch.on('delete', (streamerInfo, i) => {
  ...
});
```

### Returns

```
{
   id: '<channelId>',
   login: '<channelUsername>',
   display_name: '<channelName>',
   broadcaster_type: '<brodcastType>',
   description: '<channelDescription>',
   profile_image_url: '<profileImage>',
   offline_image_url: '<offlineImage>',
   view_count: <viewCount>,
   created_at: '<creationTime>'
}
currentInstance
```

### Example

```javascript
const { Notify, TwitchExtension } = require("yt-notify");
const notify = new Notify({
   apiKey: "Your youtube ApiKey",
   extensions: {
      twitch: new TwitchExtension({
         clientId: "Twitch client id",
         token: "Twitch token id",
      })
   }
});
const twitch = notify.twitch;

...

twitch.on('delete', (streamerInfo, i) => {
  console.log(streamerInfo);
});
```

</details>

---

<details><summary>isLive</summary>

---

This event is activated when a streamer start a **new live**.

### Use

```javascript
twitch.on('isLive', (items) => {
  ...
});
```

### Returns

```
{
   id: '<channelId>',
   login: '<channelUsername>',
   display_name: '<channelName>',
   broadcaster_type: '<brodcastType>',
   description: '<channelDescription>',
   profile_image_url: '<profileImage>',
   offline_image_url: '<offlineImage>',
   view_count: <viewCount>,
   created_at: '<creationTime>'
}
```

### Example

```javascript
const { Notify, TwitchExtension } = require("yt-notify");
const notify = new Notify({
   apiKey: "Your youtube ApiKey",
   extensions: {
      twitch: new TwitchExtension({
         clientId: "Twitch client id",
         token: "Twitch token id",
      })
   }
});
const twitch = notify.twitch;

...

twitch.on('isLive', (items) => {
  console.log(items);
});
```

</details>

---
