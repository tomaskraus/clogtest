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
    const results = await doTests("./test/inputs/empty.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("non-empty input with no assertions returns empty result", async () => {
    const results = await doTests(
      "./test/inputs/no-assertions-and-some-output.js"
    );
    const { totalCount } = getStats(results);
    expect(totalCount).toEqual(0);
  });

  test("non-empty input with some output after the succeeded assertion does NOT throw an `unchecked output error`", async () => {
    const results = await doTests(
      "./test/inputs/some-output-after-assertion.js"
    );
    const { totalCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(results[0].pass).toBeTruthy();
  });

  test("newline assertions work", async () => {
    const results = await doTests("./test/inputs/newlines.js");
    const { totalCount, passedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(passedCount).toEqual(2);
  });

  test("tests computed multi-line output", async () => {
    const results = await doTests("./test/inputs/computed-multi-line.js");
    const { totalCount, passedCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(passedCount).toEqual(1);
  });

  test("input with two assertions means two results", async () => {
    const results = await doTests("./test/inputs/one-true-one-false.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();

    expect(failedCount).toEqual(1);
    const fails = results.filter(failedResultPredicate);
    expect(fails[0].pass).toBeFalsy();
  });

  test("input with assertions inside catch blocks works", async () => {
    const results = await doTests("./test/inputs/multiple-error-success.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(failedCount).toEqual(0);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeTruthy();
  });

  test("Fully block-commented code means empty results", async () => {
    const results = await doTests("./test/inputs/comment-all.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("Empty output assertion works", async () => {
    const results = await doTests("./test/inputs/empty-output-assertion.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(failedCount).toEqual(0);
    expect(results[0].pass).toBeTruthy();
  });

  test("Assertions inside block comments are not tested", async () => {
    const results = await doTests("./test/inputs/comments.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(3);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[2].pass).toBeTruthy();
    expect(failedCount).toEqual(1);
  });

  test("Assertion without a body fails.", async () => {
    const results = await doTests("./test/inputs/empty-assertion.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(2);
    expect(results[0].pass).toBeFalsy();
    expect(results[0].error).not.toBeUndefined();
    expect(results[1].pass).toBeTruthy();
    expect(failedCount).toEqual(1);
  });
});

// ------------------------------------------------

describe("possible error ops", () => {
  test("assertions-under-used", async () => {
    const results = await doTests("./test/inputs/assertions-under-used.js");
    const { totalCount } = getStats(results);
    expect(totalCount).toEqual(3);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[1].received).toMatch("1\n2");
    expect(results[2].pass).toBeFalsy();
    expect(results[2].received).toMatch("3\n4");
  });

  test("assertions-over-used", async () => {
    const results = await doTests("./test/inputs/assertions-over-used.js");
    const { totalCount } = getStats(results);
    expect(totalCount).toEqual(5);
    expect(results[0].pass).toBeTruthy();
    expect(results[0].received).toEqual("");
    expect(results[1].pass).toBeTruthy();
    expect(results[1].received).toEqual("");
    expect(results[2].pass).toBeTruthy();
    expect(results[2].received).toEqual("123");
    expect(results[3].pass).toBeTruthy();
    expect(results[3].received).toEqual("");
    expect(results[4].pass).toBeTruthy();
    expect(results[4].received).toEqual("");
  });

  test("assertions-over-used-no-output", async () => {
    const results = await doTests(
      "./test/inputs/assertions-over-used-no-output.js"
    );
    const { totalCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(results[0].pass).toBeTruthy();
    expect(results[0].received).toEqual("");
  });
});

describe("TypeScript", () => {
  test("Can test typescript files:", async () => {
    const results = await doTests(
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
    const results = await doTests("./test/inputs/custom-assertion-mark.js");
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
    const results = await doTests("./test/inputs/one-true-one-false.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("Skips custom assertion marks with skip mark", async () => {
    const results = await doTests(
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
    const results = await doTests("./test/inputs/skip-assertion-mark.js");
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
  test("syntactically wrong source without any assertion means error result:", async () => {
    const results = await doTests(
      "./test/inputs/invalid-source-unasserted.js"
    );
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(failedCount).toEqual(1);
    expect(results[0].error.message).toMatch("error");
  });

  test("Error-throwing source without any assertion means error result:", async () => {
    const results = await doTests(
      "./test/inputs/error-throwing-source-unasserted.js"
    );
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(failedCount).toEqual(1);
    expect(results[0].error.message).toMatch("error");
  });

  test("Error-throwing source with previous assertions means error result at the end:", async () => {
    const results = await doTests(
      "./test/inputs/error-throwing-source-with-prev-assertions.js"
    );
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(3); //assertions + error
    expect(failedCount).toEqual(2);
    expect(results[0].pass).toBeFalsy();
    expect(results[1].pass).toBeTruthy();
    expect(results[2].error.message).toMatch("error");
  });

  // ----------

  test("Valid test until the first error-throw only. Even if that error does match the assertion, if there are more assertions after that, returns error.", async () => {
    const results = await doTests(
      "./test/inputs/throws-only-the-first-error.js"
    );
    expect(results.length).toEqual(4); // 3 + one additional result error
    expect(results[0].pass).toBeTruthy();
    // test did not produce output for the rest of assertions
    expect(results[1].pass).toBeTruthy();
    expect(results[2].pass).toBeFalsy();
    expect(results[2].received).toBeUndefined();
    expect(results[3].pass).toBeFalsy();
    expect(results[3].error.message).toMatch("The source has ended prematurely");
  });
});

describe("Source that does catch the Error:", () => {
  test("Tests the error output of syntactically wrong source, asserted:", async () => {
    const results = await doTests("./test/inputs/invalid-source-asserted.js");
    const { totalCount, passedCount } = getStats(results);
    expect(totalCount).toEqual(1);
    expect(passedCount).toEqual(1);
  });

  test("Tests error-throwing asserted source:", async () => {
    const results = await doTests("./test/inputs/error-throwing-asserted.js");
    const { totalCount, passedCount } = getStats(results);
    expect(results[0].received).toMatch(/Unexpected token/);
    expect(totalCount).toEqual(1);
    expect(passedCount).toEqual(1);
  });
});

// --------------------------------------------

describe("keepTempFile test", () => {
  const { getInjectedFileName } = engineProvider();

  test("does not delete the temporary file if keepTempFile property is set to true", async () => {
    const { doTests } = engineProvider({ keepTempFile: true });

    await doTests("test/inputs/keep-temp-1.js");

    await expect(
      fs.access(
        getInjectedFileName("test/inputs/keep-temp-1.js"),
        fs.constants.F_OK
      )
    ).resolves.toBeUndefined();
  });

  test("deletes the temporary file if keepTempFile property is set to default", async () => {
    expect.assertions(2);
    const { doTests } = engineProvider();

    const results = await doTests("test/inputs/keep-temp-2.js");
    expect(results.length).toEqual(2);

    try {
      await fs.access(
        getInjectedFileName("test/inputs/keep-temp-2.js"),
        fs.constants.F_OK
      );
    } catch (err) {
      expect(err.code).toMatch("ENOENT");
    }
  });
});
