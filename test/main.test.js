// const mock = require("mock-fs");

const { doTestInputsAndInput, doTests } = require("../src/main");

const doTestsFromFile = async (fileName) => {
  const [testInputs] = await doTestInputsAndInput(fileName);
  return doTests(testInputs);
};

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
    const [results, fails] = await doTestsFromFile("./test/inputs/empty.js");
    expect(results.length).toEqual(0);
  });

  test("input with no assertions means empty results", async () => {
    const [results, fails] = await doTestsFromFile(
      "./test/inputs/no-assertions.js"
    );
    expect(results.length).toEqual(0);
  });

  test("input with two assertions means two results", async () => {
    const [results, fails] = await doTestsFromFile(
      "./test/inputs/one-true-one-false.js"
    );
    expect(results.length).toEqual(2);
    expect(results[0].pass).toBeTruthy();
    expect(results[1].pass).toBeFalsy();

    expect(fails.length).toEqual(1);
    expect(fails[0].pass).toBeFalsy();
  });
});
