const engineFn = require("../src/engine");

const { doTests, srcName, getStats, failedResultPredicate } = engineFn();

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

describe("Custom test mark:", () => {
  const { doTests } = engineFn("// Expected output:");

  test("Works with custom test mark", async () => {
    const [results] = await doTests("./test/inputs/custom-test-mark.js");
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

  test("Recognizes only custom test marks in the input", async () => {
    const [results] = await doTests("./test/inputs/one-true-one-false.js");
    const { totalCount, failedCount } = getStats(results);
    expect(totalCount).toEqual(0);
    expect(failedCount).toEqual(0);
  });

  test("Skips custom test marks with skip mark", async () => {
    const [results] = await doTests(
      "./dist/test/inputs/custom-test-mark-skip.js",
      "./test/inputs/custom-test-mark-skip.ts"
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

describe("Skip test mark:", () => {
  test("Skips tests with skip-mark", async () => {
    const [results] = await doTests("./test/inputs/skip-test-mark.js");
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
