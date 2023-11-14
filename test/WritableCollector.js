const { Writable } = require("stream");

// A Helper used in testing to collect lines pushed into the stream
exports.WritableCollector = class WritableCollector extends Writable {
  constructor(options) {
    super(options);
    this.collectedBuffer = Buffer.alloc(0);
  }

  _write(chunk, encoding, callback) {
    this.collectedBuffer = Buffer.concat([this.collectedBuffer, chunk]);
    callback();
  }
};
