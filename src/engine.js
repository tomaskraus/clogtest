/**
 * ClogTest API.
 */

const SSP = require("simple-string-pattern").default;

const { getTestInputAndSource, runTests } = require("./core.js");
const { appLog } = require("./utils.js");
const log = appLog.extend("engine");

/**
 *
 * @param {string} jsFileName
 * @param {string} tsFileName
 * @returns {string} tsFileName if it is not null/undefined, else jsFileName
 */
const srcName = (jsFileName, tsFileName) => {
  if (jsFileName.slice(-3) !== ".js") {
    throw new Error(`jsFileName: [${jsFileName}] must end with ".js"`);
  }
  return tsFileName || jsFileName;
};

/**
 * Creates a tests performing function.
 * @param {string} testMark
 * @returns {(string, string | null) => [testResults[], testResults[],string[]]} doTests function
 */
const createDoTests =
  (testMark) =>
  /**
   * Performs tests.
   * @param {string} fileName
   * @param {string | null} tsFileName
   * @returns {[testResults[], testResults[],string[]]} [all results, failures, source content]
   */
  async (fileName, tsFileName = null) => {
    const [testInputs, source] = await getTestInputAndSource(
      testMark,
      fileName,
      tsFileName
    );
    const testResults = runTests(testInputs);
    return [...testResults, source];
  };

/**
 * Creates an assertions-fill function.
 * @param {string} testMark
 * @returns {string, string | null, null | (string, number, string) => void}
 */
const createFillAssertions =
  (testMark) =>
  /**
   * Fills empty assertions with received output values.
   * @param {string} fileName
   * @param {string | null} tsFileName
   * @param {null | (string, number, string) => void} onTestMarkFn callback function (srcFileName, lineNumber, line). called on every testMark line
   * @returns {[string[] ,number]} output lines, number of assertions filled.
   */
  async (fileName, tsFileName = null, onTestMarkFn = null) => {
    const MAX_WRITTEN_PATTERN_LENGTH = 20;

    const srcFileName = srcName(fileName, tsFileName);
    log(`fillAssertions, from file: [${srcFileName}]`);
    const [testInputs, inputs] = await getTestInputAndSource(
      testMark,
      fileName,
      tsFileName
    );
    let testInputIndex = 0;
    let assertionsFilledCount = 0;

    const content = inputs.map((line, index) => {
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
          log(`fill assertion [${lineNumber}] [${s}]`);
          if (onTestMarkFn) {
            onTestMarkFn(srcFileName, lineNumber, s);
          }
        }
        testInputIndex++;
      }
      return s;
    });
    log(`[${assertionsFilledCount}] assertion comment(s) filled.`);
    return [content, assertionsFilledCount];
  };

// ------------------------------------------------
const DEFAULT_TEST_MARK = "//=>";

// do not use trailing or leading spaces in testMark
module.exports = (testMark = DEFAULT_TEST_MARK) => {
  log(`Engine created with testMark: [${testMark}]`);
  return {
    srcName,
    /**
     * Performs tests.
     * @param {string} fileName
     * @param {string | null} tsFileName
     * @returns {[testResults[], testResults[],string[]]} [all results, failures, source content]
     */
    doTests: createDoTests(testMark),
    /**
     * Fills empty assertions with received output values.
     * @param {string} fileName
     * @param {string | null} tsFileName
     * @param {null | (string, number, string) => void} onTestMarkFn callback function (srcFileName, lineNumber, line). called on every testMark line
     * @returns {[string[] ,number]} output lines, number of assertions filled.
     */
    fillAssertions: createFillAssertions(testMark),
    testMark,
  };
};
