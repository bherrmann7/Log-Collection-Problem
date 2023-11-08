const fs = require("fs");
const { Readable } = require("stream");

/**
 * Reads a file but backwards.  The first chunk is the last part of the file, etc... until it reaches the beginning of the file.  Then it sends
 * a null chunk at the end.
 */

exports.ReverseFileReader = class ReverseFileReader extends Readable {
  constructor(filePath, options = {}) {
    super(options);
    this.filePath = filePath;
    this.bufferSize = options.bufferSize || 16383;
    this.position = null;
    this.buffer = Buffer.alloc(this.bufferSize);
    this.amountToRead = this.bufferSize;
  }

  _read() {
    if (this.position === null) {
      // Initialize the position to the end of the file minus the buffer size
      fs.stat(this.filePath, (err, stats) => {
        if (err) {
          this.emit("error", err);
        } else {
          this.position = Math.max(0, stats.size - this.bufferSize);
          this._read(); // Trigger the initial read
        }
      });
      return;
    }
    if (this.fd == null) {
      // Open file
      fs.open(this.filePath, "r", (err, fd) => {
        if (err) {
          this.emit("error", err);
        } else {
          this.fd = fd;
          this._read();
        }
      });
      return;
    }

    fs.read(
      this.fd,
      this.buffer,
      0,
      this.amountToRead,
      this.position,
      (err, bytesRead) => {
        if (err) {
          this.emit("error", err);
          this._closeFile();
          return;
        }
        if (bytesRead === 0) {
          // Humm. Is this really an error, or does it mean I need to try again?
          this.emit(
            "error",
            new Error("How did I get a bytesRead of 0?  File truncation?"),
          );
          return;
        }
        this.push(this.buffer.subarray(0, bytesRead));

        // was that the last chunk?
        if (this.position === 0) {
          this.push(null);
          this._closeFile();
          return;
        }

        // We need to adjust the position for the next read.
        if (this.position < this.bufferSize) {
          this.amountToRead = this.position;
          this.position = 0;
        } else {
          this.position -= this.bufferSize;
        }
      },
    );
  }

  _closeFile() {
    fs.close(this.fd, (err) => {
      if (err) {
        this.emit("error", new Error("Error closing file: " + err));
      }
    });
  }
};
