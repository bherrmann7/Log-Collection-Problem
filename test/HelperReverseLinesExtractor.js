const { ReverseLinesExtractor } = require("../ReverseLinesExtractor");
let reverseLinesExtractor;

// Ingests a string into the lines extractor
exports.ingest = function (chunkAsString) {
  let chunk = Buffer.from(chunkAsString);
  return reverseLinesExtractor.extractLines(chunk, chunk.length);
};

// Initialize the lines extractor, used by the test's beforeEach method
exports.setup = function () {
  reverseLinesExtractor = new ReverseLinesExtractor();
};
