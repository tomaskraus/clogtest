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
const { createPattern } = require("loose-string-test");
const fs = require("fs/promises");

const appName = require("../package.json").name;

const TEST_MARK = "//=>";

const printHeader = (action, fileName) => {
  out(`${appName} ${action}: ${fileName}`);
};

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
  printHeader("test", fileName);
  const [testInputs, inputs] = await doTestInputsAndInput(fileName);
  const [allResults, fails] = await doTests(testInputs);
  printResults(allResults, fails, fileName, inputs);
  return fails.length === 0 ? 0 : 1;
};

const writeAssertions = async (fileName) => {
  printHeader("write-assertions", fileName);
  const [testInputs, inputs] = await doTestInputsAndInput(fileName);
  let testInputIndex = 0;
  let assertionsFilledCount = 0;

  const content = inputs
    .map((line, index) => {
      let s = line;
      if (
        testInputIndex < testInputs.length &&
        index + 1 === testInputs[testInputIndex].lineNumber
      ) {
        if (testInputs[testInputIndex].expected === "") {
          s =
            TEST_MARK +
            " " +
            createPattern(testInputs[testInputIndex].received);
          assertionsFilledCount++;
          out(`\t${fileName}:${index + 1}`);
        }
        testInputIndex++;
      }
      return s;
    })
    .join("\n");
  if (assertionsFilledCount > 0) {
    await fs.writeFile(fileName, content);
  }
  out(`${assertionsFilledCount} assertion comment(s) filled`);
};

module.exports = {
  doTestInputsAndInput,
  doTestsAndPrintResults,
  doTests,
  writeAssertions,
};
