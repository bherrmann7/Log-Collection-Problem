const fs = require("fs");
const express = require("express");
const app = express();
const { ReverseFileReader } = require("./ReverseFileReader");
const { ReverseLinesTransform } = require("./ReverseLinesTransform");
const { pipeline } = require("stream");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

app.get("/", async (request, response) => {
  const { filename, n, filter } = request.query;
  if (!filename || filename.includes("..")) {
    response.status(400).send("Invalid filename");
    return;
  }
  const fullFilename = "/var/log/" + filename;
  try {
    fs.accessSync(fullFilename, fs.constants.R_OK);
  } catch (error) {
    response.status(404).send("File not found or not accessible");
    return;
  }

  const reverseFileReader = new ReverseFileReader(fullFilename);
  const transform = new ReverseLinesTransform(n, filter);

  // reverseFileReader.pipe(transform).pipe(response);
  pipeline(reverseFileReader, transform, response, (error) => {
    if (error) {
      console.error("Pipeline failed:", error);
    }
  });
});
