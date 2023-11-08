const { ingest, setup } = require("./HelperReverseLinesExtractor.js");

describe("ReverseLinesExtractor", () => {
  beforeEach(() => setup());

  test("example animal tests in docs", () => {
    let lines = ingest("cow\ndog\nwolf\n");
    expect(lines).toEqual(["wolf\n", "dog\n"]);

    lines = ingest("cat\nhappy ");
    expect(lines).toEqual(["happy cow\n"]);
  });

  test("very first partial line is discarded", () => {
    let lines = ingest("pigs dont fly\nbirds fly\ncows have hooves");
    expect(lines).toEqual(["birds fly\n"]);

    lines = ingest(""); // signals the end
    expect(lines).toEqual(["pigs dont fly\n"]);
  });

  test("remove last two lines from chunk.", () => {
    let lines = ingest("line 1\nline 2\nline 3\n");
    expect(lines).toEqual(["line 3\n", "line 2\n"]);

    lines = ingest("");
    expect(lines).toEqual(["line 1\n"]);
  });

  test("no newline means no lines.", () => {
    let lines = ingest("A very long line");
    expect(lines).toEqual([]);

    lines = ingest("");
    expect(lines).toEqual([]);
  });

  test("zero length file", () => {
    let lines = ingest("");
    expect(lines).toEqual([]);

    expect(() => ingest("anything")).toThrow(
      "I'm expressing surprise at being called again! I thought were were all done.",
    );
  });

  test("single blank line", () => {
    let lines = ingest("\n");
    expect(lines).toEqual([]);

    lines = ingest("");
    expect(lines).toEqual(["\n"]);

    expect(() => ingest("anything")).toThrow(
      "I'm expressing surprise at being called again! I thought were were all done.",
    );
  });

  test("two blank lines", () => {
    let lines = ingest("\n\n");
    expect(lines).toEqual(["\n"]);

    lines = ingest("");
    expect(lines).toEqual(["\n"]);

    expect(() => ingest("anything")).toThrow(
      "I'm expressing surprise at being called again! I thought were were all done.",
    );
  });

  test("test the end of the chunks, no trailing new line", () => {
    let lines = ingest("This is the first line in the file");
    expect(lines).toEqual([]);

    lines = ingest("");
    expect(lines).toEqual([]);
  });
});
