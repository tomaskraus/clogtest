const engineProvider = require("../src/engine");
const fs = require("fs/promises");

const keepTempFile = process.env.KEEP_TEMP_FILE === "1";

const { doTests, srcName, getStats, failedResultPredicate } = engineProvider({
  keepTempFile,
});

describe("srcName", () => {
  test("returns js file if ts is undefined", () => {
    expect(srcName("hello.js")).toEqual("hello.js");
  });

  test("returns ts if ts is defined", () => {
    expect(srcName("hello.js", "hi.ts")).toEqual("hi.ts");
  });

  test("throws error if js file name does not end with '.js'", () => {
    expect(() => srcName("hello.ts")).toThrow(/\.js/);
    expect(() => srcName("hello.ts", "hi.ts")).toThrow(/\.js/);
    expect(() => srcName("hello", "hi.ts")).toThrow(/\.js/);
  });
});

describe("normal ops", () => {
  test("empty input means empty results", async () => {
    const [results] = await doTests("./test/inputs/empty.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("input with no assertions means empty results", async () => {
    const [results] = await doTests("./test/inputs/no-assertions.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("tests newlines", async () => {
    const [results] = await doTests("./test/inputs/newlines.js");
    const { totalCount, passedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(passedCount).toEqual(2);
  });

  test("tests computed multi-line output", async () => {
    const [results] = await doTests("./test/inputs/computed-multi-line.js");
    const { totalCount, passedCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(passedCount).toEqual(1);
  });

  test("input with two assertions means two results", async () => {
    const [results] = await doTests("./test/inputs/one-true-one-false.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();

    expect(failedCount).toEqual(1);
    const fails = results.filter(failedResultPredicate);
    expect(fails[0].pass).toBeFalsy();
  });

  test("input with assertions inside catch blocks works", async () => {
    const [results] = await doTests("./test/inputs/multiple-error-success.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(failedCount).toEqual(0);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeTruthy();
  });

  test("Fully block-commented code means empty results", async () => {
    const [results] = await doTests("./test/inputs/comment-all.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("Empty output assertion works", async () => {
    const [results] = await doTests("./test/inputs/empty-output-assertion.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(failedCount).toEqual(0);
    expect(results[0].pass).toBeTruthy();
  });

  test("Assertions inside block comments are not tested", async () => {
    const [results] = await doTests("./test/inputs/comments.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(3);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[2].pass).toBeTruthy();
    expect(failedCount).toEqual(1);
  });

  test("Assertion without a body fails.", async () => {
    const [results] = await doTests("./test/inputs/empty-assertion.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(results[0].pass).toBeFalsy();
    expect(results[0].errMsg).not.toBeUndefined();
    expect(results[1].pass).toBeTruthy();
    expect(failedCount).toEqual(1);
  });
});

describe("error ops", () => {
  test("assertions-over-under-used", async () => {
    const [results] = await doTests(
      "./test/inputs/assertions-over-under-used.js"
    );
    const { totalCount } = getStats(results);
    expect(totalCount).toEqual(7);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[2].pass).toBeFalsy();
    expect(results[3].pass).toBeTruthy();
    expect(results[4].pass).toBeTruthy();
    expect(results[5].pass).toBeTruthy();
    expect(results[6].pass).toBeTruthy();
  });
});

describe("TypeScript", () => {
  test("Can test typescript files:", async () => {
    const [results] = await doTests(
      "./dist/test/inputs/ts-input.js",
      "./test/inputs/ts-input.ts"
    );
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(3);
    expect(results[0].expected).toEqual("1");
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[2].pass).toBeTruthy();
    expect(failedCount).toEqual(1);
  });
});

// -------------------------------------------

describe("Custom assertion mark:", () => {
  const { doTests } = engineProvider({
    assertionMark: "// Expected output:",
    keepTempFile,
  });

  test("Works with custom assertion mark", async () => {
    const [results] = await doTests("./test/inputs/custom-assertion-mark.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(8);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeTruthy();
    expect(results[2].pass).toBeTruthy();
    expect(results[3].pass).toBeTruthy();
    expect(results[4].pass).toBeTruthy();
    expect(results[5].pass).toBeTruthy();
    expect(results[6].pass).toBeFalsy();
    expect(results[7].pass).toBeTruthy();

    expect(failedCount).toEqual(1);
  });

  test("Recognizes only custom assertion marks in the input", async () => {
    const [results] = await doTests("./test/inputs/one-true-one-false.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("Skips custom assertion marks with skip mark", async () => {
    const [results] = await doTests(
      "./dist/test/inputs/custom-assertion-mark-skip.js",
      "./test/inputs/custom-assertion-mark-skip.ts"
    );
    const { totalCount, failedCount, skippedCount, passedCount } =
      getStats(results);
    expect(totalCount).toEqual(8);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeTruthy();
    expect(results[2].skip).toBeTruthy();
    expect(results[3].pass).toBeTruthy();
    expect(results[4].skip).toBeTruthy();
    expect(results[5].skip).toBeTruthy();
    expect(results[6].pass).toBeFalsy();
    expect(results[7].pass).toBeTruthy();

    expect(skippedCount).toEqual(3);
    expect(passedCount).toEqual(4);
    expect(failedCount).toEqual(1);
  });
});

describe("Skip assertion mark:", () => {
  test("Skips tests with skip-mark", async () => {
    const [results] = await doTests("./test/inputs/skip-assertion-mark.js");
    const { totalCount, failedCount, passedCount, skippedCount } =
      getStats(results);
    expect(totalCount).toEqual(2);
    expect(passedCount).toEqual(1);
    expect(failedCount).toEqual(0);
    expect(skippedCount).toEqual(1);
  });
});

// -------------------------------------------

describe("Source that throws Error:", () => {
  test("Syntaxically wrong source without any assertion means empty results:", async () => {
    const [results] = await doTests(
      "./test/inputs/invalid-source-no-assertions.js"
    );
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("Error-throwing source without any assertion means empty results:", async () => {
    const [results] = await doTests(
      "./test/inputs/error-throwing-source-no-assertions.js"
    );
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("Tests the error output of syntaxically wrong source:", async () => {
    const [results] = await doTests("./test/inputs/invalid-source.js");
    const { passedCount } = getStats(results);
    expect(passedCount).toEqual(1);
  });

  test("Tests error-throwing source:", async () => {
    const [results] = await doTests("./test/inputs/error-throwing.js");
    const { passedCount } = getStats(results);
    expect(results[0].received).toMatch(/Unexpected token/);
    expect(passedCount).toEqual(1);
  });

  test("Valid test until the first error-throw only:", async () => {
    const [results] = await doTests(
      "./test/inputs/throws-only-the-first-error.js"
    );
    expect(results.length).toEqual(3);
    expect(results[0].pass).toBeTruthy();
    // test did not produce output for the rest of assertions
    expect(results[1].pass).toBeTruthy();
    expect(results[2].pass).toBeFalsy();
  });
});

// --------------------------------------------

describe("keepTempFile test", () => {
  const { getInjectedFileName } = engineProvider();

  const FILE_NAME = "./test/inputs/one-true-one-false.js";
  const TEMP_FILE_NAME = getInjectedFileName(FILE_NAME);

  beforeEach(async () => {
    try {
      await fs.rm(TEMP_FILE_NAME);
    } catch (err) {
      expect(err.message).toMatch(/ENOENT/);
    }
  });

  test("does not delete the temporary file if keepTempFile property is set to true", async () => {
    const { doTests } = engineProvider({ keepTempFile: true });

    await doTests(FILE_NAME);

    await expect(
      fs.access(TEMP_FILE_NAME, fs.constants.F_OK)
    ).resolves.toBeUndefined();
  });

  test("deletes the temporary file if keepTempFile property is set to default", async () => {
    expect.assertions(2);
    const { doTests } = engineProvider();

    const [results] = await doTests(FILE_NAME);
    expect(results.length).toEqual(2);

    try {
      await fs.access(TEMP_FILE_NAME, fs.constants.F_OK);
    } catch (err) {
      expect(err.code).toMatch("ENOENT");
    }
  });
});
