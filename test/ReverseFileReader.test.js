const ReverseFileReader = require("../ReverseFileReader").ReverseFileReader;
const fsPromises = require("fs").promises;
const { once } = require("events");

// This is a test helper.
// Takes a string "foo" and breaks it into chunks (of size bufferSize) and reverses them.
// ie function breakStringIntoChunksFromEndAndReverse("foo",1) returns ["o", "o", "f"]
function breakStringIntoChunksFromEndAndReverse(content, bufferSize) {
  const strings = [];
  do {
    strings.push(content.slice(-bufferSize));
    content = content.substring(0, content.length - bufferSize);
  } while (content.length !== 0);
  return strings;
}

describe("ReverseFileReader", () => {
  test("bah, testing the test helper", () => {
    expect(breakStringIntoChunksFromEndAndReverse("salad", 1)).toEqual([
      "d",
      "a",
      "l",
      "a",
      "s",
    ]);
    expect(breakStringIntoChunksFromEndAndReverse("a1b2c", 2)).toEqual([
      "2c",
      "1b",
      "a",
    ]);
    expect(breakStringIntoChunksFromEndAndReverse("AABBB", 3)).toEqual([
      "BBB",
      "AA",
    ]);
  });

  test("should produce expected chunks", async () => {
    // Create a temporary test file
    const tmpPath = "/tmp/testFile.txt";
    const testContent = "This is a test content.";
    //                  234512345123451234512345
    // split by 5 and reversed.
    const expectedStrings = ["tent.", "t con", "a tes", "s is ", "Thi"];
    await fsPromises.writeFile(tmpPath, testContent, "utf8");

    // Call the function and test it
    const chunkSize = 5;
    const reader = new ReverseFileReader(tmpPath, {
      bufferSize: chunkSize,
      highWaterMark: 1024,
    });

    const receivedStrings = [];

    reader.on("data", (chunk, length) => {
      receivedStrings.push(chunk.subarray(0, length).toString());
    });

    await once(reader, "end");

    expect(receivedStrings).toEqual(expectedStrings);

    // Clean up the temporary test file
    await fsPromises.unlink(tmpPath);
  });

  test("slightly maniacal, try a range of buffer sizes", async () => {
    const bufferSizes = Array.from({ length: 70 }, (_, index) => index + 1);
    bufferSizes.push(128);
    bufferSizes.push(1024);

    const tmpPath = "/tmp/testFile.txt";
    const testContent = "This is a test content.";
    await fsPromises.writeFile(tmpPath, testContent, "utf8");

    for (let i = 0; i < bufferSizes.length; i++) {
      const bufferSize = bufferSizes[i];
      const expectedStrings = breakStringIntoChunksFromEndAndReverse(
        testContent,
        bufferSize,
      );

      // Call the function and test it
      const reader = new ReverseFileReader(tmpPath, {
        bufferSize: bufferSize,
        highWaterMark: 1024,
      });

      const receivedStrings = [];

      reader.on("data", (chunk, length) => {
        receivedStrings.push(chunk.subarray(0, length).toString());
      });

      await once(reader, "end");

      expect(receivedStrings).toEqual(expectedStrings);
    }

    // Clean up the temporary test file
    await fsPromises.unlink(tmpPath);
  });
});
