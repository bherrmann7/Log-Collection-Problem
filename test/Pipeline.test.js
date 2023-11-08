const fs = require("fs");
const fsPromises = fs.promises;
const { once } = require("events");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { Readable } = require("stream");
const { ReverseFileReader } = require("../ReverseFileReader");
const { ReverseLinesTransform } = require("../ReverseLinesTransform");
const { WritableCollector } = require("./WritableCollector");

// Generate a long ascii string used in testing.
// ie. !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstu...
const longLine = (() => {
  let line = "";
  for (let i = 0; i < 200; i++) {
    line += String.fromCharCode(32 + (i % 95));
  }
  return line;
})();

// Generate line a of a random length (up 200 characters)
let lineNumber = 0;
function generateRandomLengthLine() {
  const lineLength = Math.floor(Math.random() * 201);
  lineNumber++;
  return lineNumber + " " + longLine.substring(0, lineLength) + "\n";
}

describe("pipeline", () => {
  test("tiny log file", async () => {
    // GIVEN
    const tmpPath = "/tmp/tiny-log.txt";
    const testContent = "line1\nline2\nline3\n";
    await fsPromises.writeFile(tmpPath, testContent);
    const expectedContent = "line3\nline2\nline1\n";

    const reverseFileReader = new ReverseFileReader(
      tmpPath,
      { bufferSize: 3 } /*BOBH*/,
    );
    const writableCollector = new WritableCollector();
    // WHEN
    reverseFileReader.pipe(new ReverseLinesTransform()).pipe(writableCollector);
    await once(writableCollector, "finish");

    // THEN
    expect(writableCollector.collectedBuffer.toString()).toEqual(
      expectedContent,
    );
  });

  test("closer to real world test", async () => {
    // GIVEN
    const reversedSampleFile = fs.readFileSync("./test/sample.tac.log");
    const reverseFileReader = new ReverseFileReader(
      "./test/sample.log",
      { bufferSize: 3 } /*BOBH*/,
    );
    const transform = new ReverseLinesTransform();
    const writableCollector = new WritableCollector();
    // WHEN
    reverseFileReader.pipe(transform).pipe(writableCollector);
    await once(writableCollector, "finish");
    // THEN
    expect(writableCollector.collectedBuffer.toString()).toEqual(
      reversedSampleFile.toString(),
    );
  });

  test("test larger generated ascii files", async () => {
    const startTime = Math.floor(Date.now() / 1000);
    const largeFilename = "/tmp/test-ascii-log-file.txt";
    const targetSize = 1e8; // breaks on; 1e9 = 1 Gig
    let expectedSize = 0;
    {
      const readableStream = new Readable({
        read(size) {
          while (expectedSize < targetSize) {
            const line = generateRandomLengthLine();
            expectedSize += line.length;
            if (!this.push(line)) {
              // If push() returns false, it means the writable stream is not ready for more data, so we pause the readable stream.
              return;
            }
          }
          this.push(null); // No more data to send
        },
      });
      const writeStream = fs.createWriteStream(largeFilename);
      readableStream.pipe(writeStream);
      await once(writeStream, "finish");
      const actualSize = fs.statSync(largeFilename).size;
      expect(actualSize).toEqual(expectedSize);
    }
    const endTime = Math.floor(Date.now() / 1000);
    console.log(`File generated. Took: ${endTime - startTime} seconds`);

    const startTime2 = Math.floor(Date.now() / 1000);
    const largeReversedFilename = largeFilename + ".node-reversed";
    const reverseFileReader = new ReverseFileReader(largeFilename, {
      bufferSize: 17,
    });
    const transform = new ReverseLinesTransform();
    const writeStream = fs.createWriteStream(largeReversedFilename);
    // WHEN
    reverseFileReader.pipe(transform).pipe(writeStream);
    await once(writeStream, "finish");
    const endTime2 = Math.floor(Date.now() / 1000);
    console.log(
      `Finished processing file. Took: ${endTime2 - startTime2} seconds`,
    );

    // THEN
    const largeFilenameTacReversed = `${largeFilename}.tac-reversed`;
    await exec(`tac <${largeFilename} > ${largeFilenameTacReversed}`);
    // await exec(`echo cow >> ${largeFilenameTacReversed}`) // test the test, by dirting the pool.
    console.log(`diff -q ${largeFilenameTacReversed} ${largeReversedFilename}`);
    await exec(`diff -q ${largeFilenameTacReversed} ${largeReversedFilename}`);
  }); // , 10 * 60 * 1000)
});
