const EventEmitter = require("events");
const Parser = require("rss-parser");
const https = require("https");
const path = require("path");
const Database = require("better-sqlite3");

const parser = new Parser();
const db = new Database(path.join(__dirname, "..", "notify.sqlite"));

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
            const arr = data.split("channel_id=");
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

    const tableName = `video_${options.channelId}`; // video-${options.channelId}

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
          ID TEXT,
          Latest TEXT
        )
      `;
    db.exec(createTableSQL);

    this.emit("create", { instance: this, channelId: options.channelId });
    const listen = setInterval(async () => {
      const query = db.prepare(`SELECT * FROM ${tableName}`);
      let setups = query.all()[0];
      if (!setups) {
        const videoDBData = await parser.parseURL(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${options.channelId}`
        );

        const delQuery = db.prepare(`DELETE FROM ${tableName}`);
        delQuery.run();

        const insertData = db.prepare(
          `INSERT OR REPLACE INTO ${tableName} (ID, Latest) VALUES (?, ?)`
        );
        insertData.run(options.channelId, videoDBData.items[0].id);
      }

      setups = query.all()[0];

      const videoData = await parser.parseURL(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${setups.ID}`
      );
      if (!videoData) return;

      const { id } = videoData.items[0];
      if (setups.Latest === id) {
        return;
      } else {
        const delQuery = db.prepare(`DELETE FROM ${tableName}`);
        delQuery.run();

        const insertData = db.prepare(
          `INSERT OR REPLACE INTO ${tableName} (ID, Latest) VALUES (?, ?)`
        );
        insertData.run(setups.ID, id);
      }

      this.emit("newVideo", videoData.items[0]);
    }, 1000);

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
