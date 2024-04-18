const {
  loadInputFile,
  createFileWithInjectedPrints,
  runFileAndGatherOutput,
  groupOutputByAssertions,
} = require("./prepare-and-run");
const {
  createTestInputs,
  runTests,
  printResults,
  out,
} = require("./test-and-report");
const appName = require("../package.json").name;

const TEST_MARK = "//=>";

const doTestInputsAndInput = async (fileName) => {
  const input = await loadInputFile(fileName);
  const injectedFileName = await createFileWithInjectedPrints(
    TEST_MARK,
    fileName,
    input
  );
  const output = runFileAndGatherOutput(injectedFileName);
  const groups = groupOutputByAssertions(TEST_MARK, output);
  const testInputs = createTestInputs(TEST_MARK, groups, input);
  return [testInputs, input];
};

const doTests = async (testInputs) => {
  const allResults = runTests(testInputs);
  return [allResults, allResults.filter((r) => !r.pass)];
};

const doTestsAndPrintResults = async (fileName) => {
  out(`${appName} ${fileName}`);
  const [testInputs, inputs] = await doTestInputsAndInput(fileName);
  const [allResults, fails] = await doTests(testInputs);
  printResults(allResults, fails, fileName, inputs);
  return fails.length === 0 ? 0 : 1;
};

module.exports = {
  doTestsAndPrintResults,
};
