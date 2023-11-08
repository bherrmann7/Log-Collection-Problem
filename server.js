const fs = require("fs");
const express = require("express");
const app = express();
const ReverseFileReader = require("./ReverseFileReader").ReverseFileReader;
const ReverseLinesTransform =
  require("./ReverseLinesTransform").ReverseLinesTransform;
const { pipeline } = require("stream");

app.use(express.json()); // Humm?

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

app.get("/log/", (request, response) => {
  // filename - need to vet.
  // n number of entries
  // filter on text/keyword matches

  const reverseFileReader = new ReverseFileReader(
    "/var/log/just10.log",
    { bufferSize: 3 } /*BOBH*/,
  );
  const transform = new ReverseLinesTransform();

  reverseFileReader.pipe(transform).pipe(response);
});
