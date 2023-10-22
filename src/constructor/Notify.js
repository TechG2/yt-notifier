const EventEmitter = require("events");
const Parser = require("rss-parser");
const https = require("https");
const { QuickDB } = require("quick.db");

const parser = new Parser();
const db = new QuickDB();

class Notify extends EventEmitter {
  /**
   * Creation of the constructor
   *
   * @param {Object} options
   * @return {Object}
   */
  constructor(options) {
    super();
    this.startedListeners = [];

    setImmediate(() => {
      this.emit("ready", this);
    });
  }

  /**
   * Gets the channelId.
   *
   * @param {String} channelUrl
   * @return {string}
   */
  async getChannelId(channelUrl) {
    return new Promise((resolve, reject) => {
      https
        .get(channelUrl, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            const arr = data.split("channel_ids=");
            const channelId = arr[1].slice(0, 24);
            resolve(channelId);
          });
        })
        .on("error", (e) => {
          reject(e.message);
        });
    });
  }

  /**
   * Creates a listener.
   *
   * @param {Object} options
   * @param {String} [options.channelId]
   * @return {null}
   */
  async createListener(options) {
    if (!options || !options.channelId)
      throw new Error(
        "You must specify the id of the channel to create a listener"
      );

    this.emit("create", { instance: this, channelId: options.channelId });
    const listen = setInterval(async () => {
      let setups = await db.get(`video-${options.channelId}`);

      if (!setups) {
        const videoDBData = await parser.parseURL(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${options.channelId}`
        );

        await db.set(`video-${options.channelId}`, {
          ID: options.channelId,
          Latest: [],
        });
      }

      setups = await db.get(`video-${options.channelId}`);

      const videoData = await parser.parseURL(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${setups.ID}`
      );
      if (!videoData) return;

      const { id } = videoData.items[0];
      if (setups.Latest.includes(id)) return;
      else {
        setups.Latest.push(id);
        await db.set(`video-${options.channelId}`, {
          ID: setups.ID,
          Latest: setups.Latest,
        });
      }

      this.emit("newVideo", videoData.items[0]);
    }, 10000);

    this.startedListeners.push({ interval: listen, id: options.channelId });
  }

  /**
   * Stops a listener.
   *
   * @param {Object} options
   * @param {String} [options.channelId]
   * @return {null}
   */
  async stopListener(options) {
    if (!this.startedListeners[0])
      throw new Error("There are no listeener to interrupt.");

    if (!options || !options.channelId)
      options = { channelId: this.startedListeners[0].id };

    let toClearInterval = this.startedListeners.filter(
      (listen) => listen.id === options.channelId
    )[0];

    clearInterval(toClearInterval.interval);

    this.startedListeners = this.startedListeners.filter(
      (listen) => listen.id !== options.channelId
    );

    this.emit("delete", { instance: this, channelId: options.channelId });
  }
}

module.exports = Notify;
