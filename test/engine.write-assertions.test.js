const { fillAssertions, testMark } = require("../src/engine")();

// this suite does not work inside engine.test.js
describe("write-assertions:", () => {
  let callbackCallCount = 0;
  const onTestMark = (fname, linenum, line) => {
    callbackCallCount++;
  };

  beforeEach(() => {
    callbackCallCount = 0;
  });

  test("Fills an empty assertion correctly.", async () => {
    const [content, filledCount] = await fillAssertions(
      "test/inputs/empty-assertion2.js",
      null,
      onTestMark
    );
    const assertions = content
      .filter((line) => line.trim().startsWith(testMark))
      .map((line) => line.slice(testMark.length).trim());
    expect(filledCount).toEqual(2);
    expect(assertions[0]).toEqual("[ 1, 2, 3, 4, 5 ]");
    expect(assertions[2]).toEqual("2");
    expect(callbackCallCount).toEqual(2);
  });

  test("TypeScript source: fills an empty assertion correctly.", async () => {
    const [content, filledCount] = await fillAssertions(
      "dist/test/inputs/empty-assertion2.js",
      "test/inputs/empty-assertion2.ts",
      onTestMark
    );
    const assertions = content
      .filter((line) => line.trim().startsWith(testMark))
      .map((line) => line.slice(testMark.length).trim());
    expect(filledCount).toEqual(2);
    expect(assertions[0]).toEqual("[ 1, 2, 3, 4, 5 ]");
    expect(assertions[2]).toEqual("2");
    expect(callbackCallCount).toEqual(2);
  });
});
