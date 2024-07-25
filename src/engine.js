/**
 * ClogTest API
 */

const { appLog } = require("./utils.js");
const log = appLog.extend("engine");
const fs = require("fs/promises");

const { getTestInputAndSource, runTests } = require("./core.js");
const SSP = require("simple-string-pattern").default;

/**
 *
 * @param {string} fileName
 * @param {string | null} tsFileName
 * @returns {[testResults[], testResults[],string[]]}
 */
const doTests =
  (testMark) =>
  async (fileName, tsFileName = null) => {
    const [testInputs, source] = await getTestInputAndSource(
      testMark,
      fileName,
      tsFileName
    );
    const testResults = runTests(testInputs);
    return [...testResults, source];
  };

const writeAssertions =
  (testMark) =>
  async (fileName, tsFileName = null, onTestMarkFn) => {
    const MAX_WRITTEN_PATTERN_LENGTH = 20;

    const srcFileName = tsFileName || fileName;
    log(`writeAssertions to file: [${srcFileName}]`);
    const [testInputs, inputs] = await getTestInputAndSource(
      testMark,
      fileName,
      tsFileName
    );
    let testInputIndex = 0;
    let assertionsFilledCount = 0;

    const content = inputs
      .map((line, index) => {
        let s = line;
        let lineNumber = index + 1;
        if (
          testInputIndex < testInputs.length &&
          lineNumber === testInputs[testInputIndex].lineNumber
        ) {
          if (testInputs[testInputIndex].expected === "") {
            s =
              testInputs[testInputIndex].linePadding +
              testMark +
              " " +
              SSP.parse(testInputs[testInputIndex].received)
                .limitPatternLen(MAX_WRITTEN_PATTERN_LENGTH)
                .value();
            assertionsFilledCount++;
            log(`write assertion [${lineNumber}] [${s}]`);
            onTestMarkFn(srcFileName, lineNumber, s);
          }
          testInputIndex++;
        }
        return s;
      })
      .join("\n");
    if (assertionsFilledCount > 0) {
      await fs.writeFile(tsFileName || fileName, content);
    }
    log(`[${assertionsFilledCount}] assertion comment(s) written.`);
    return assertionsFilledCount;
  };

// ------------------------------------------------
const DEFAULT_TEST_MARK = "//=>";

// do not use trailing or leading spaces in testMark
module.exports = (testMark = DEFAULT_TEST_MARK) => {
  log(`Engine created with testMark: [${testMark}]`);
  return {
    doTests: doTests(testMark),
    writeAssertions: writeAssertions(testMark),
  };
};
