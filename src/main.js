const { createTestInputsAndInput } = require("./prepare-and-run");
const { runTests, printResults, out } = require("./test-and-report");
const appName = require("../package.json").name;

const TEST_MARK = "//=>";

const doTests = async (fileName) => {
  const [testInputs] = await createTestInputsAndInput(TEST_MARK, fileName);
  return runTests(testInputs);
};

const doTestsAndPrintResults = async (fileName) => {
  out(`${appName} test: ${fileName}`);
  const [testInputs, inputs] = await createTestInputsAndInput(
    TEST_MARK,
    fileName
  );
  const [allResults, fails] = runTests(testInputs);
  printResults(allResults, fails, fileName, inputs);
  return fails.length === 0 ? 0 : 1;
};

module.exports = {
  doTestsAndPrintResults,
  doTests,
};
