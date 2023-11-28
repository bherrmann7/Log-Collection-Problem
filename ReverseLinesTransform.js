const { Transform } = require("stream");
const { ReverseLinesExtractor } = require("./ReverseLinesExtractor");
exports.ReverseLinesTransform = class ReverseLinesTransform extends Transform {
  constructor(linesToSendCount, filterStr) {
    super();
    this.reverseLinesExtractor = new ReverseLinesExtractor();
    this.linesToSendCount = linesToSendCount;
    this.filterStr = filterStr;
  }

  _transform(chunk, encoding, callback) {
    let lines = this.reverseLinesExtractor.extractLines(chunk);
    lines = this.considerFilterAndCount(lines);
    if (lines !== null) {
      this.push(Buffer.from(lines.join("")));
    }
    if (this.linesToSendCount !== undefined && this.linesToSendCount === 0) {
      this.push(null);
    }
    callback();
  }

  considerFilterAndCount(lines) {
    // handle filter logic
    if (this.filterStr) {
      lines = lines.filter((str) => str.includes(this.filterStr));
    }

    // handle line limits
    if (this.linesToSendCount !== undefined) {
      let countOfLinesToPush = Math.min(lines.length, this.linesToSendCount);
      lines = lines.slice(0, countOfLinesToPush);
      this.linesToSendCount -= countOfLinesToPush;
    }
    return lines;
  }

  // Here we handle the case where are out of data, so we could still have to push the first line of the file
  _flush(callback) {
    // if we have already finished, then dont do anything
    if (this.linesToSendCount !== 0) {
      // push remaining lines
      let lines = this.reverseLinesExtractor.extractLines(null);
      lines = this.considerFilterAndCount(lines);
      if (lines !== null) {
        this.push(Buffer.from(lines.join("")));
      }
    }
    callback();
  }
};
