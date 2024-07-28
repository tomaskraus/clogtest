const engineFn = require("../src/engine");

const { doTests, srcName } = engineFn();

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
    const [results, fails] = await doTests("./test/inputs/empty.js");
    expect(results.length).toEqual(0);
    expect(fails.length).toEqual(0);
  });

  test("input with no assertions means empty results", async () => {
    const [results, fails] = await doTests("./test/inputs/no-assertions.js");
    expect(results.length).toEqual(0);
    expect(fails.length).toEqual(0);
  });

  test("input with two assertions means two results", async () => {
    const [results, fails] = await doTests(
      "./test/inputs/one-true-one-false.js"
    );
    expect(results.length).toEqual(2);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();

    expect(fails.length).toEqual(1);
    expect(fails[0].pass).toBeFalsy();
  });

  test("Fully block-commented code means empty results", async () => {
    const [results, fails] = await doTests("./test/inputs/comment-all.js");
    expect(results.length).toEqual(0);
    expect(fails.length).toEqual(0);
  });

  test("Empty output assertion works", async () => {
    const [results, fails] = await doTests(
      "./test/inputs/empty-output-assertion.js"
    );
    expect(results.length).toEqual(2);
    expect(fails.length).toEqual(0);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeTruthy();
  });

  test("Assertions inside block comments are not tested", async () => {
    const [results, fails] = await doTests("./test/inputs/comments.js");
    expect(results.length).toEqual(3);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[2].pass).toBeTruthy();
    expect(fails.length).toEqual(1);
    expect(fails[0].pass).toBeFalsy();
  });

  test("Empty Assertion fails.", async () => {
    const [results, fails] = await doTests("./test/inputs/empty-assertion.js");
    expect(results.length).toEqual(2);
    expect(results[0].pass).toBeFalsy();
    expect(results[0].errMsg).not.toBeUndefined();
    expect(results[1].pass).toBeTruthy();
    expect(fails.length).toEqual(1);
    expect(fails[0].pass).toBeFalsy();
  });
});

describe("error ops", () => {
  test("Two consecutive assertions (i.e. without any output between them) are left unnoticed if there are some ececutable code lines between them.", async () => {
    const [results, fails] = await doTests(
      "./test/inputs/err-consecutive-assertions-unnoticed.js"
    );
    expect(results.length).toEqual(3);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].expected).toEqual('""');
    expect(results[1].pass).toBeTruthy();
    expect(results[2].pass).toBeTruthy();
  });
});

describe("TypeScript", () => {
  test("Can test typescript files:", async () => {
    const [results, fails] = await doTests(
      "./dist/test/inputs/ts-input.js",
      "./test/inputs/ts-input.ts"
    );
    expect(results.length).toEqual(3);
    expect(results[0].expected).toEqual("1");
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[2].pass).toBeTruthy();
    expect(fails.length).toEqual(1);
    expect(fails[0].pass).toBeFalsy();
  });
});

// -------------------------------------------

describe("Custom test mark:", () => {
  const { doTests } = engineFn("// Expected output:");

  test("Works with custom test mark", async () => {
    const [results, fails] = await doTests("./test/inputs/custom-test-mark.js");
    expect(results.length).toEqual(8);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeTruthy();
    expect(results[2].pass).toBeTruthy();
    expect(results[3].pass).toBeTruthy();
    expect(results[4].pass).toBeTruthy();
    expect(results[5].pass).toBeTruthy();
    expect(results[6].pass).toBeFalsy();
    expect(results[7].pass).toBeTruthy();

    expect(fails.length).toEqual(1);
    expect(fails[0].pass).toBeFalsy();
  });

  test("Recognizes only custom test marks in the input", async () => {
    const [results, fails] = await doTests(
      "./test/inputs/one-true-one-false.js"
    );
    expect(results.length).toEqual(0);
    expect(fails.length).toEqual(0);
  });
});

// -------------------------------------------

describe("Engine failures:", () => {
  test("Throws Error if syntactically invalid javascript file is passed:", async () => {
    await expect(() =>
      doTests("./test/inputs/invalid-source.js")
    ).rejects.toThrow(/Missing semicolon/);
  });
});
