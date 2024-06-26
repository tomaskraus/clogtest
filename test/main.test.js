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
  });

  test("input with no assertions means empty results", async () => {
    const [results, fails] = await doTests("./test/inputs/no-assertions.js");
    expect(results.length).toEqual(0);
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
});
