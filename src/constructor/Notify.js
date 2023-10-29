const EventEmitter = require("events");
const Parser = require("rss-parser");
const https = require("https");
const path = require("path");
const Database = require("better-sqlite3");
const axios = require("axios");

const parser = new Parser();
const db = new Database(path.join(__dirname, "..", "notify.sqlite"));

class Notify extends EventEmitter {
  /**
   * Creation of the constructor
   *
   * @param {Object} options
   * @param {String} [options.apiKey]
   * @param {Object} [options.extensions]
   * @param {Object} [options.extensions.twitch]
   * @return {Object}
   */
  constructor(options) {
    super();
    const extensions = [];
    this.startedListeners = [];

    if (!options || !options.apiKey) {
      throw new Error("Api key missing");
    }
    this.key = options.apiKey;

    if (options.extensions)
      this.extensions = Object.keys(options.extensions).map(
        (key, index) => options.extensions[key].name
      );

    if (options.extensions && options.extensions.twitch)
      extensions.push(options.extensions.twitch);

    if (extensions[0]) {
      extensions.forEach((extension) => {
        this[extension.name] = extension;
      });
    }

    setImmediate(() => {
      this.emit("ready", this);
    });
  }

  /**
   * Gets the videoId.
   *
   * @param {String} videoUrl
   * @return {string}
   */
  async getVideoId(videoUrl) {
    return new Promise((resolve, reject) => {
      https
        .get(videoUrl, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            const arr = data.split("video_id=");
            const channelId = arr[1].slice(0, 11);
            resolve(channelId);
          });
        })
        .on("error", (e) => {
          reject(e.message);
        });
    });
  }

  /**
   * Fetch video info from id.
   *
   * @param {Object} options
   * @param {String} [options.videoId]
   * @return {string}
   */
  async fetchVideo(options) {
    if (!options || !options.videoId)
      throw new Error(
        "You must specify the id of the channel to create a listener"
      );

    const apiKey = this.key;

    // Get info
    let fetchVideoInfo = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet&id=${options.videoId}`
    );
    fetchVideoInfo = fetchVideoInfo.data.items[0].snippet;

    let statistics = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${options.videoId}&key=${apiKey}`
    );
    statistics = statistics.data.items[0].statistics;

    let authorInfo = await axios.get(
      `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,statistics&id=${fetchVideoInfo.channelId}`
    );
    authorInfo = authorInfo.data.items[0];

    return {
      id: options.videoId,
      title: fetchVideoInfo.title,
      description: fetchVideoInfo.description,
      link: `https://www.youtube.com/watch?v=${options.videoId}`,
      releaed: fetchVideoInfo.publishedAt,
      thumbnails: {
        default: fetchVideoInfo.thumbnails.default
          ? fetchVideoInfo.thumbnails.default.url
          : null,
        medium: fetchVideoInfo.thumbnails.medium
          ? fetchVideoInfo.thumbnails.medium.url
          : null,
        high: fetchVideoInfo.thumbnails.high
          ? fetchVideoInfo.thumbnails.high.url
          : null,
        standard: fetchVideoInfo.thumbnails.standard
          ? fetchVideoInfo.thumbnails.standard.url
          : null,
        maxres: fetchVideoInfo.thumbnails.maxres
          ? fetchVideoInfo.thumbnails.maxres.url
          : null,
      },
      statistics: statistics,
      author: {
        link: `https://www.youtube.com/channel/${fetchVideoInfo.channelId}`,
        name: authorInfo.snippet.title,
        description: authorInfo.snippet.description,
        avatars: {
          default: authorInfo.snippet.thumbnails.default.url,
          medium: authorInfo.snippet.thumbnails.medium.url,
          high: authorInfo.snippet.thumbnails.high.url,
        },
        statistics: {
          subscribers: authorInfo.statistics.subscriberCount,
          videoCount: authorInfo.statistics.videoCount,
          views: authorInfo.statistics.viewCount,
        },
      },
    };
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

    // Listener
    const videoDBData = await parser.parseURL(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${options.channelId}`
    );

    const tableName = `video_${videoDBData.items[0].author
      .replaceAll(" ", "_")
      .toLowerCase()}`;

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
          ID TEXT,
          Latest TEXT
        )
      `;
    db.exec(createTableSQL);

    this.emit("create", options.channelId, this);
    const listen = setInterval(async () => {
      const query = db.prepare(`SELECT * FROM ${tableName}`);
      let setups = query.all()[0];
      if (!setups) {
        const delQuery = db.prepare(`DELETE FROM ${tableName}`);
        delQuery.run();

        const insertData = db.prepare(
          `INSERT OR REPLACE INTO ${tableName} (ID, Latest) VALUES (?, ?)`
        );
        insertData.run(options.channelId, null);
      }

      setups = query.all()[0];

      const videoData = await parser.parseURL(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${setups.ID}`
      );
      if (!videoData) return;

      const { id, pubDate } = videoData.items[0];
      const videoDate = new Date(pubDate);
      const currentDate = new Date();
      currentDate.setMinutes(currentDate.getMinutes() - 10);

      if (setups.Latest === id || videoDate <= currentDate) {
        return;
      } else {
        const delQuery = db.prepare(`DELETE FROM ${tableName}`);
        delQuery.run();

        const insertData = db.prepare(
          `INSERT OR REPLACE INTO ${tableName} (ID, Latest) VALUES (?, ?)`
        );
        insertData.run(setups.ID, id);
      }

      const rawData = videoData.items[0];

      const apiKey = this.key;

      // Get info
      let fetchVideoInfo = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&part=snippet&id=${rawData.id.replace(
          "yt:video:",
          ""
        )}`
      );
      fetchVideoInfo = fetchVideoInfo.data.items[0].snippet;

      let statistics = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${rawData.id.replace(
          "yt:video:",
          ""
        )}&key=${apiKey}`
      );
      statistics = statistics.data.items[0].statistics;

      let authorInfo = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&part=snippet,statistics&id=${fetchVideoInfo.channelId}`
      );
      authorInfo = authorInfo.data.items[0];

      const data = {
        id: rawData.id,
        title: rawData.title,
        description: fetchVideoInfo.description,
        link: rawData.link,
        releaed: fetchVideoInfo.publishedAt,
        thumbnails: {
          thumbnails: {
            default: fetchVideoInfo.thumbnails.default
              ? fetchVideoInfo.thumbnails.default.url
              : null,
            medium: fetchVideoInfo.thumbnails.medium
              ? fetchVideoInfo.thumbnails.medium.url
              : null,
            high: fetchVideoInfo.thumbnails.high
              ? fetchVideoInfo.thumbnails.high.url
              : null,
            standard: fetchVideoInfo.thumbnails.standard
              ? fetchVideoInfo.thumbnails.standard.url
              : null,
            maxres: fetchVideoInfo.thumbnails.maxres
              ? fetchVideoInfo.thumbnails.maxres.url
              : null,
          },
        },
        statistics: statistics,
        author: {
          link: `https://www.youtube.com/channel/${fetchVideoInfo.channelId}`,
          name: authorInfo.snippet.title,
          description: authorInfo.snippet.description,
          avatars: {
            default: authorInfo.snippet.thumbnails.default.url,
            medium: authorInfo.snippet.thumbnails.medium.url,
            high: authorInfo.snippet.thumbnails.high.url,
          },
          statistics: {
            subscribers: authorInfo.statistics.subscriberCount,
            videoCount: authorInfo.statistics.videoCount,
            views: authorInfo.statistics.viewCount,
          },
        },
      };

      this.emit("newVideo", data, this);
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

    this.emit("delete", options.channelId, this);
  }
}

module.exports = Notify;
