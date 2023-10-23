# YouTube Notify

An npm package that run codes when a specified channel publishes a video.

# Summary

1. [ Installation. ](#installation)
2. [ Use. ](#usage)
3. [ Documentation. ](#docs)
   - [ Inizialization. ](#inizialization)
   - [ Function. ](#functions)
   - [ Events. ](#events)
4. [ Change Logs. ](#change)
5. [ Documentation. ](#docs)
    - [ Inizialization. ](#inizialization)
    - [ Function. ](#functions)
    - [ Events. ](#events)

<a name='installation'></a>

# Installation

```
npm install yt-notifier
```

<a name='usage'></a>

# Use

```javascript
const { Notify } = require("yt-notifier");
const notify = new Notify();

notify.on("ready", async () => {
  const id = await notify.getChannelId("https://www.youtube.com/@example"); // Youtube channel url

  // Create the listener
  notify.createListener({ channelId: id });
});

// Event for when the video is published
notify.on("newVideo", (items) => {
  console.log(items);
});
```

<a name='change'></a>

# Change Logs

## v1.0.0: (last-release)

- Added ready create, delete and newVideo events.
- Added Notify constructor.
- Added getChannelId, createListener and stopListener functions.

<a name='change'></a>

# Change Logs

## v1.1.0: (last-release)

- Fixed a bug with the video upload tracker.
- Changed the data store system.

## Old release:

---

<details><summary>v1.0.0</summary>

- Added ready create, delete and newVideo events.
- Added Notify constructor.
- Added getChannelId, createListener and stopListener functions.

</details>

---

<a name='docs'></a>

# Documentation

<a name='inizialization'></a>

## Inizialization

```javascript
const { Notify } = require("yt-notifier");
const notify = new Notify();
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
{channelId}
```

### createListener()

Creates a listener and active **create**, when the listener is create, and **newVideo**, when the specified channel upload a video, events.

#### Use

```javascript
notify.createListener({ channelId: id });
```

### stopListener()

Stops a listener and active **delete** event.

#### Use

```javascript
notify.stopListener({ channelId: id });
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
notify.on('ready', () => {
  ...
});
```

### Returns

```
null
```

### Example

```javascript
const { Notify } = require("yt-notifier");
const notify = new Notify();

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
notify.on('create', (n) => {
  ...
});
```

### Returns

```
{n.channelId}
```

### Exaple

```javascript
const { Notify } = require('yt-notifier');
const notify = new Notify();

notify.createListener({ channelId: id });

...

notify.on('create', (n) => {
  console.log(n.channelId);
});
```

</details>

---

<details><summary>Delete</summary>

---

This event is activated when a listener is **deleted**.

### Use

```javascript
notify.on('delete', (n) => {
  ...
});
```

### Returns

```
{n.channelId}
```

### Exaple

```javascript
const { Notify } = require('yt-notifier');
const notify = new Notify();

notify.stopListener({ channelId: id });

...

notify.on('delete', (n) => {
  console.log(n.channelId);
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
{items}
```

### Exaple

```javascript
const { Notify } = require('yt-notifier');
const notify = new Notify();

notify.createListener({ channelId: id });

...

notify.on('newVideo', (items) => {
  console.log(items);
});
```

</details>

---
