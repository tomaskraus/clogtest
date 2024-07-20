const { getPaddingStr } = require("../src/utils");

describe("getPaddingStr", () => {
  test("On empty string, returns empty string.", () => {
    expect(getPaddingStr("")).toEqual("");
  });

  test("Returns empty string on a string that does not start with space.", () => {
    expect(getPaddingStr("hello")).toEqual("");
  });

  test("Returns empty string on a string that does not start with space.", () => {
    expect(getPaddingStr("hello")).toEqual("");
  });

  test("Returns leading spaces.", () => {
    expect(getPaddingStr("  abc")).toEqual("  ");
    expect(getPaddingStr("    ")).toEqual("    ");
    expect(getPaddingStr(" a  bc")).toEqual(" ");
  });

  test("Accepts a tab as space character.", () => {
    expect(getPaddingStr("\tabc")).toEqual("\t");
    expect(getPaddingStr(" \t")).toEqual(" \t");
    expect(getPaddingStr(" \t a  bc")).toEqual(" \t ");
  });

  test("Returns correct count of leading spaces if multi-byte sequence occurs.", () => {
    expect(getPaddingStr("  🙂")).toEqual("  ");
    expect(getPaddingStr("🙂")).toEqual("");
  });
});
