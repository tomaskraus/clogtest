const { getTestInputAndSource } = require("./prepare-and-run");
const { runTests, printResults, out } = require("./test-and-report");
const { appLog } = require("./utils.js");
const log = appLog.extend("main");
const SSP = require("simple-string-pattern").default;
const fs = require("fs/promises");

const appName = require("../package.json").name;

const MAX_WRITTEN_PATTERN_LENGTH = 20;

const TEST_MARK = "//=>";

const printHeader = (action, fileName) => {
  out(`${appName} ${action}: ${fileName}`);
};

/**
 *
 * @param {string} fileName
 * @param {string | null} tsFileName
 * @returns
 */
const doTests = async (fileName, tsFileName = null) => {
  const [testInputs] = await getTestInputAndSource(
    TEST_MARK,
    fileName,
    tsFileName
  );
  return runTests(testInputs);
};

const doTestsAndPrintResults = async (fileName, tsFileName = null) => {
  printHeader("test", tsFileName || fileName);
  const [testInputs, source] = await getTestInputAndSource(
    TEST_MARK,
    fileName,
    tsFileName
  );
  const [allResults, fails] = runTests(testInputs);
  printResults(allResults, fails, tsFileName || fileName, source);
  return fails.length === 0 ? 0 : 1;
};

const writeAssertions = async (fileName, tsFileName = null) => {
  printHeader("write-assertions", fileName);
  const [testInputs, inputs] = await getTestInputAndSource(
    TEST_MARK,
    fileName,
    tsFileName
  );
  let testInputIndex = 0;
  let assertionsFilledCount = 0;

  const content = inputs
    .map((line, index) => {
      let s = line;
      let lineIndex = index + 1;
      if (
        testInputIndex < testInputs.length &&
        lineIndex === testInputs[testInputIndex].lineNumber
      ) {
        if (testInputs[testInputIndex].expected === "") {
          s =
            testInputs[testInputIndex].linePadding +
            TEST_MARK +
            " " +
            SSP.parse(testInputs[testInputIndex].received)
              .limitPatternLen(MAX_WRITTEN_PATTERN_LENGTH)
              .value();
          assertionsFilledCount++;
          log(`write assertion [${lineIndex}] [${s}]`);
          out(`\t${fileName}:${lineIndex}`);
        }
        testInputIndex++;
      }
      return s;
    })
    .join("\n");
  if (assertionsFilledCount > 0) {
    await fs.writeFile(tsFileName || fileName, content);
  }
  out(`${assertionsFilledCount} assertion comment(s) filled`);
};

module.exports = {
  doTestsAndPrintResults,
  doTests,
  writeAssertions,
};
