const fs = require("fs");
const fsPromises = fs.promises;
const { once } = require("events");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { Readable, pipeline } = require("stream");
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

// Keep track of current line number, mostly for debugging.
let lineNumber = 0;

function generateRandomLengthLine() {
  const lineLength = Math.floor(Math.random() * 201);
  lineNumber++;
  return lineNumber + " " + longLine.substring(0, lineLength) + "\n";
}

// A place to read from with various tests setting up data in the file.
const tmpFile = "/tmp/ctt-test-input.log";

// A quick way to populate the contents of the test file.
async function createTestFile(content) {
  await fsPromises.writeFile(tmpFile, content);
}

// Run the test file through the pipeline with the provided args.
async function processTestFileContents(n, filterStr) {
  const reverseFileReader = new ReverseFileReader(tmpFile);
  const writableCollector = new WritableCollector();
  const reverseLinesTransform = new ReverseLinesTransform(n, filterStr);
  // WHEN
  reverseFileReader.pipe(reverseLinesTransform).pipe(writableCollector);
  await once(writableCollector, "finish");
  return writableCollector.collectedBuffer.toString();
}

describe("pipeline", () => {
  test("tiny log file", async () => {
    // GIVEN
    await createTestFile("line1\nline2\nline3\n");
    // WHEN
    let actualContent = await processTestFileContents();
    // THEN
    expect(actualContent).toEqual("line3\nline2\nline1\n");
  });

  test("closer to real world test", async () => {
    // GIVEN - a file with a part of a stack trace
    const reverseFileReader = new ReverseFileReader("./test/sample.log");
    const transform = new ReverseLinesTransform();
    const writableCollector = new WritableCollector();
    // WHEN
    reverseFileReader.pipe(transform).pipe(writableCollector);
    await once(writableCollector, "finish");
    // THEN
    // verify that it is identical to the file processed with the unix "tac" command.
    const reversedSampleFile = fs.readFileSync("./test/sample.tac.log");
    expect(writableCollector.collectedBuffer).toEqual(reversedSampleFile);
  });

  test("test larger generated ascii files", async () => {
    const startTime = Math.floor(Date.now() / 1000);
    const largeFilename = "/tmp/test-ascii-log-file.txt";
    const targetSize = 1e3; // using 1e9 is 1 gig, takes a few minutes
    let expectedSize = 0;
    // GIVEN - This block generates a large file.
    {
      const readableStream = new Readable({
        read() {
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
    // console.log(`File generated. Took: ${endTime - startTime} seconds`);

    // THEN - Now lets push the large file through the pipeline
    const startTime2 = Math.floor(Date.now() / 1000);
    const largeReversedFilename = largeFilename + ".node-reversed";
    const reverseFileReader = new ReverseFileReader(largeFilename);
    const transform = new ReverseLinesTransform();
    const writeStream = fs.createWriteStream(largeReversedFilename);
    // WHEN
    pipeline(reverseFileReader, transform, writeStream, (error) => {
      if (error) {
        console.error("Pipeline failed:", error);
      }
    });
    await once(writeStream, "finish");
    const endTime2 = Math.floor(Date.now() / 1000);
    /*console.log(
      `Finished processing file. Took: ${endTime2 - startTime2} seconds`,
    );*/

    // THEN - verify the generated file matches the unix "tac" version of the same file.
    const largeFilenameTacReversed = `${largeFilename}.tac-reversed`;
    await exec(`tac <${largeFilename} > ${largeFilenameTacReversed}`);
    // await exec(`echo cow >> ${largeFilenameTacReversed}`) // test the test, by dirtying the pool.
    // console.log(`diff -q ${largeFilenameTacReversed} ${largeReversedFilename}`);
    await exec(`diff -q ${largeFilenameTacReversed} ${largeReversedFilename}`);
  });

  test("zero length file.", async () => {
    // GIVEN
    await createTestFile("");
    // WHEN
    let actualContent = await processTestFileContents();
    // THEN
    expect(actualContent).toEqual("");
  });

  test("almost empty length file.", async () => {
    // GIVEN
    await createTestFile("file without a new line is effectively empty");
    // WHEN
    let actualContent = await processTestFileContents();
    // THEN
    expect(actualContent).toEqual("");
  });

  test("only return 2 lines", async () => {
    // GIVEN
    await createTestFile("a\nb1 \nb 2\nc\nb 3\n");
    // WHEN
    let actualContent = await processTestFileContents(2);
    // THEN
    expect(actualContent).toEqual("b 3\nc\n");
  });

  test("only return 1 lines", async () => {
    // GIVEN
    await createTestFile("a\nb1 \nb 2\nc\nb 3\n");
    // WHEN
    let actualContent = await processTestFileContents(1);
    // THEN
    expect(actualContent).toEqual("b 3\n");
  });

  test("only return 0 lines", async () => {
    // GIVEN
    await createTestFile("a\nb1 \nb 2\nc\nb 3\n");
    // WHEN
    let actualContent = await processTestFileContents(0);
    // THEN
    expect(actualContent).toEqual("");
  });

  test("filter on string", async () => {
    // GIVEN
    await createTestFile("dog1\nholy cow1\nbird\n");
    // WHEN
    let actualContent = await processTestFileContents(undefined, "cow");
    // THEN
    expect(actualContent).toEqual("holy cow1\n");
  });

  test("filter and return only matching count.", async () => {
    // GIVEN
    await createTestFile("cat 1\ndog 1\ncat 2\ndog 2\ncat 3\n");
    // WHEN
    let actualContent = await processTestFileContents(2, "cat");
    // THEN
    expect(actualContent).toEqual("cat 3\ncat 2\n");
  });
});
