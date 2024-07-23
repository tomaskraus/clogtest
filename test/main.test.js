// const mock = require("mock-fs");

const { doTests } = require("../src/main");

// beforeEach(() => {
//   mock({
//     "empty.js": "",
//   });
//   mock.file();
// });

// afterEach(() => {
//   mock.restore();
// });

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

  test("Assertions inside block comments are not tested", async () => {
    const [results, fails] = await doTests("./test/inputs/comments.js");
    expect(results.length).toEqual(3);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();
    expect(results[2].pass).toBeTruthy();
    expect(fails.length).toEqual(1);
    expect(fails[0].pass).toBeFalsy();
  });
});

describe("TypeScript", () => {
  test("Can test typescript files:", async () => {
    const [results, fails] = await doTests(
      "./dist/test/inputs/ts-input.js",
      "./test/inputs/ts-input.ts"
    );
    expect(results.length).toEqual(2);
    expect(results[0].expected).toEqual("1");
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeTruthy();
  });
});
