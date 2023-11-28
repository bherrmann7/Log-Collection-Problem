/**
 * Give an chunk of log file, extract the lines and return them in reverse order.
 *
 * If the chunk has 0 length, then the final line is returned, or null.
 *
 * ie.   first chunk: "cow\ndog\nwolf\n"
 *       return result [ "wolf\n", "dog\n" ]  ;; cow is not a complete line.  the next chunk could continue it.
 *
 *       next chunk: "cat\nhappy"
 *       return result [ "happy cow\n" ]
 */
exports.ReverseLinesExtractor = class ReverseLinesExtractor {
  constructor() {
    // when line continues in next chunk, we save the end part in the remaining buffer
    this.remainingBuffer = null;
    // during first time we discard the possibly incomplete line at the end of the file
    this.firstTime = true;
    // indicates we are finished, and dont expect to be called again
    this.allDone = false;
  }

  extractLines(chunk) {
    if (this.allDone) {
      throw new Error(
        "I'm expressing surprise at being called again! I thought were were all done.",
      );
    }

    // All done, send the remaining Buffer as a line (if needed)
    if (chunk === null || chunk.length === 0) {
      this.allDone = true;
      if (this.remainingBuffer === null) {
        return [];
      }
      return [this.remainingBuffer.toString()];
    }

    const lines = [];
    let end = chunk.length - 1;

    if (this.firstTime) {
      this.firstTime = false;
      // on the first time, we ignore chars from the end to the first newline
      // because this is presumably the last part of the first chunk (end of the file) could contain
      // an incomplete (non-flushed) line
      while (end >= 0) {
        if (chunk[end] === 10) {
          break;
        }
        end--;
      }
    }
    let pos = end - 1;

    while (pos >= 0) {
      let byte = chunk[pos];
      if (byte === 10) {
        let line = chunk.subarray(pos + 1, end + 1);

        // If we have remaining bytes from a prior chunk, tack them on now.
        if (this.remainingBuffer !== null) {
          line += this.remainingBuffer.toString();
          this.remainingBuffer = null;
        }
        lines.push(line.toString());
        end = pos;
      }
      pos--;
    }

    // stick remaining part of line into buffer
    // BOB: What is out maximum line length and how do we handle that?
    if (end >= 0) {
      if (this.remainingBuffer === null) {
        this.remainingBuffer = Buffer.concat([chunk.subarray(0, end + 1)]);
      } else {
        this.remainingBuffer = Buffer.concat([
          chunk.subarray(0, end + 1),
          this.remainingBuffer,
        ]);
      }
    }
    return lines;
  }
};
