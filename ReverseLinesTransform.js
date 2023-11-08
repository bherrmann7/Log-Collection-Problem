const { Transform } = require("stream");
const ReverseLinesExtractor =
  require("./ReverseLinesExtractor").ReverseLinesExtractor;
exports.ReverseLinesTransform = class ReverseLinesTransform extends Transform {
  constructor() {
    super();
    this.reverseLinesExtractor = new ReverseLinesExtractor();
  }

  _transform(chunk, encoding, callback) {
    const lines = this.reverseLinesExtractor.extractLines(chunk, chunk.length);
    this.push(Buffer.from(lines.join("")));
    callback();
  }

  _flush(callback) {
    const lines = this.reverseLinesExtractor.extractLines("", 0);
    this.push(Buffer.from(lines.join("")));
    callback();
  }
};
