const EventEmitter = require("events");
const axios = require("axios");
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "notify.sqlite"));

class TwitchExtension extends EventEmitter {
  /**
   * Creation of the constructor
   *
   * @param {Object} options
   * @param {Object} [options.clientId]
   * @param {Object} [options.token]
   * @return {Object}
   */
  constructor(options) {
    super();

    if (!options) options = {};

    this.name = "twitch";
    this.startedListeners = [];

    this.clientId = options.clientId;
    this.token = options.token;

    if (!this.clientId || !this.token) {
      throw new Error("The client id or token has not been specified.");
    }

    setImmediate(() => {
      this.emit("ready", this);
    });
  }

  /**
   * Creates a listener.
   *
   * @param {Object} options
   * @param {String} [options.channel]
   * @return {null}
   */
  async createListener(options) {
    if (!options || !options.channel)
      throw new Error(
        "You must specify the id of the channel to create a listener"
      );

    const userData = await axios.get(
      `https://api.twitch.tv/helix/users?login=${options.channel}`,
      {
        headers: {
          "Client-ID": this.clientId,
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    this.emit("create", userData.data.data[0], this);

    const listen = setInterval(async () => {
      // Listener
      const streamData = await axios.get(
        `https://api.twitch.tv/helix/streams?user_login=${options.channel}`,
        {
          headers: {
            "Client-ID": this.clientId,
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!streamData.data.data[0]) {
        return;
      }

      const tableName = `live_${streamData.data.data[0].user_name
        .replace(" ", "_")
        .toLowerCase()}`;
      const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
          ID TEXT,
          Latest TEXT
        )
      `;
      db.exec(createTableSQL);

      const query = db.prepare(`SELECT * FROM ${tableName}`);
      let setups = query.all()[0];
      if (!setups) {
        const delQuery = db.prepare(`DELETE FROM ${tableName}`);
        delQuery.run();

        const insertData = db.prepare(
          `INSERT OR REPLACE INTO ${tableName} (ID, Latest) VALUES (?, ?)`
        );
        insertData.run(options.channel, null /* streamData.data.data[0].id */);
      }

      setups = query.all()[0];

      const streamCheckData = await axios.get(
        `https://api.twitch.tv/helix/streams?user_login=${options.channel}`,
        {
          headers: {
            "Client-ID": this.clientId,
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      if (!streamCheckData) return;

      const { id } = streamCheckData.data.data[0];

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

      this.emit("isLive", streamCheckData.data.data[0], this);
    }, 1000);

    this.startedListeners.push({ interval: listen, id: options.channel });
  }

  /**
   * Stops a listener.
   *
   * @param {Object} options
   * @param {String} [options.channel]
   * @return {null}
   */
  async stopListener(options) {
    if (!this.startedListeners[0])
      throw new Error("There are no listeener to interrupt.");

    const userData = await axios.get(
      `https://api.twitch.tv/helix/users?login=${options.channel}`,
      {
        headers: {
          "Client-ID": this.clientId,
          Authorization: `Bearer ${this.token}`,
        },
      }
    );
    if (!options || !options.channelId)
      options = { channelId: this.startedListeners[0].id };

    let toClearInterval = this.startedListeners.filter(
      (listen) => listen.id === options.channelId
    )[0];

    clearInterval(toClearInterval.interval);

    this.startedListeners = this.startedListeners.filter(
      (listen) => listen.id !== options.channel
    );

    this.emit("delete", userData.data.data[0], this);
  }
}

module.exports = TwitchExtension;
