const { createTestInputsAndInput } = require("./prepare-and-run");
const { runTests, printResults, out } = require("./test-and-report");
const SSP = require("simple-string-pattern").default;
const fs = require("fs/promises");

const appName = require("../package.json").name;

const MAX_WRITTEN_PATTERN_LENGTH = 20;

const TEST_MARK = "//=>";

const printHeader = (action, fileName) => {
  out(`${appName} ${action}: ${fileName}`);
};

const doTests = async (fileName) => {
  const [testInputs] = await createTestInputsAndInput(TEST_MARK, fileName);
  return runTests(testInputs);
};

const doTestsAndPrintResults = async (fileName) => {
  printHeader("test", fileName);
  const [testInputs, inputs] = await createTestInputsAndInput(
    TEST_MARK,
    fileName
  );
  const [allResults, fails] = runTests(testInputs);
  printResults(allResults, fails, fileName, inputs);
  return fails.length === 0 ? 0 : 1;
};

const writeAssertions = async (fileName) => {
  printHeader("write-assertions", fileName);
  const [testInputs, inputs] = await createTestInputsAndInput(
    TEST_MARK,
    fileName
  );
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
            SSP.parse(testInputs[testInputIndex].received)
              .limitPatternLen(MAX_WRITTEN_PATTERN_LENGTH)
              .value();
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
  doTestsAndPrintResults,
  doTests,
  writeAssertions,
};
