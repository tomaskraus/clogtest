/**
 * prepares the data for tests
 */

const { appLog, getPaddingStr } = require("./utils.js");
const log = appLog.extend("core");

const fs = require("fs/promises");
const Path = require("path");

const { switchTrueFalse, nthElementAfter } = require("stateful-predicates");

window = {}; // NodeJS hack for console-redirect
const redirect = require("console-redirect");
const streamBuffers = require("stream-buffers");
const process = require("node:process");
const SSP = require("simple-string-pattern").default;

/**
 *
 * @param {string} fileName
 * @returns {Promise<string>}
 */
const loadInputFile = async (fileName) => {
  log(`opening input file [${fileName}]`);
  const data = await fs.readFile(fileName, { encoding: "utf-8" });
  return data.split("\n");
};

const createBlockCommentPredicate = () =>
  switchTrueFalse(
    (s) => s.trimStart().startsWith("/*"),
    nthElementAfter(1, (s) => s.trimEnd().endsWith("*/"))
  );

/**
 *
 * @param {string} testMark
 * @param {string} inputFileName
 * @param {[string]} inputFileLines
 * @returns {Promise<string>} a name of a newly created file
 */
const createFileWithInjectedAssertionPrints = async (
  testMark,
  inputFileName,
  inputFileLines
) => {
  const parsedPath = Path.parse(inputFileName);
  const injectedFileName = Path.normalize(
    Path.join(parsedPath.dir, `.clogtest.${parsedPath.name}${parsedPath.ext}`)
  );
  log(`creating injected file [${injectedFileName}]`);

  const isInBlockComment = createBlockCommentPredicate();

  const injectedContent = inputFileLines
    .reduce((acc, line) => {
      if (!isInBlockComment(line)) {
        acc.push(line);
        if (line.trimStart().startsWith(testMark)) {
          acc.push(`console.log('${testMark}')`);
        }
      }
      return acc;
    }, [])
    .join("\n");
  await fs.writeFile(injectedFileName, injectedContent);
  log(`createFileWithInjectedPrints saved into [${injectedFileName}]`);
  return injectedFileName;
};

/**
 *
 * @param {string} fileName
 * @returns {[string]}
 */
const runSourceAndGatherOutputLines = (fileName) => {
  log(`runFile [${fileName}]`);
  const buff = new streamBuffers.WritableStreamBuffer();
  const myConsole = redirect(buff, process.stderr, true);

  try {
    require(process.cwd() + Path.sep + fileName);
  } finally {
    myConsole.release();
    buff.end();
  }
  const outputLines = (buff.getContentsAsString() || "").split("\n");
  log(`runFileAndGatherOutputLines: [${outputLines.length}] lines`);
  return outputLines;
};

/**
 *
 * @param {string} testMarkStr
 * @param {[string]} outputLines
 * @returns {[string]}
 */
const groupOutputByAssertions = (testMarkStr, outputLines) => {
  const [_, groups] = outputLines.reduce(
    ([currentOutputStr, outputArr], line) => {
      if (line.startsWith(testMarkStr)) {
        outputArr.push(currentOutputStr);
        return ["", outputArr];
      }
      currentOutputStr += currentOutputStr === "" ? line : "\n" + line;
      return [currentOutputStr, outputArr];
    },
    ["", []]
  );
  log(`groupOutput item count [${groups.length}]`);
  return groups;
};

const prepareAssertionStr = (testMark, s) => {
  return s.slice(testMark.length).trim();
};

/**
 *
 * @param {string} testMarkStr
 * @param {[string]} outputGroups
 * @param {[string]} inputFileLines
 * @returns {[object]} [{lineNumber: number, linePadding: string, expected: string, received: string}]
 */
const createTestInputs = (testMarkStr, outputGroups, inputFileLines) => {
  lineNumber = 1;
  groupIndex = 0;
  const isInCommentBlock = createBlockCommentPredicate();
  const testInputs = inputFileLines
    .map((line) => ({
      lineNumber: lineNumber++,
      linePadding: getPaddingStr(line),
      expected: line.trim(),
    }))
    .filter(
      (item) =>
        !isInCommentBlock(item.expected) &&
        item.expected.startsWith(testMarkStr)
    )
    .map((item) => ({
      ...item,
      expected: prepareAssertionStr(testMarkStr, item.expected),
      received: outputGroups[groupIndex++], // groups are as many as testMarks
    }));
  log(`testInput item count [${testInputs.length}]`);
  return testInputs;
};

/**
 *
 * @param {string} testMarkStr
 * @param {string} fileName
 * @param {string?} tsFileName
 * @returns {Promise<[[object], [string]]>}
 */
const getTestInputAndSource = async (testMarkStr, fileName, tsFileName) => {
  const input = await loadInputFile(fileName);
  let tsInput = null;
  let voidAssertionInjectedFileName = null;
  if (tsFileName) {
    log(`typeScript file requested: [${tsFileName}]`);
    tsInput = await loadInputFile(tsFileName);
  }
  try {
    voidAssertionInjectedFileName = await createFileWithInjectedAssertionPrints(
      testMarkStr,
      fileName,
      input
    );
    const output = runSourceAndGatherOutputLines(voidAssertionInjectedFileName);
    const groups = groupOutputByAssertions(testMarkStr, output);
    const source = tsInput || input;
    const testInputs = createTestInputs(testMarkStr, groups, source);
    return [testInputs, source];
  } finally {
    if (voidAssertionInjectedFileName) {
      log(`deleting [${voidAssertionInjectedFileName}] ...`);
      await fs.rm(voidAssertionInjectedFileName);
      log(`... deleted: [${voidAssertionInjectedFileName}]`);
    }
  }
};

// ----------------------------------------------------------------

const testOneItem = ({ lineNumber, expected, received }) => {
  log(`  testOneItem  [${lineNumber}] ssp:[${expected}] input:[${received}]`);

  let pass = false;
  let errMsg = undefined;
  try {
    pass = new SSP(expected).test(received);
  } catch (err) {
    errMsg = err.message;
  }
  return {
    lineNumber,
    expected,
    received,
    pass,
    errMsg,
  };
};

/**
 *
 * @param {[object]} testInputs [{lineNumber: number, expected: string, received: string, pass: boolean}]
 * @returns
 */
const runTests = (testInputs) => {
  log(`runTests running [${testInputs.length}] test(s)`);
  const allResults = testInputs.map(testOneItem);
  const fails = allResults.filter((t) => !t.pass);
  log(`Results: all [${allResults.length}], fails [${fails.length}]`);
  return [allResults, fails];
};

module.exports = {
  getTestInputAndSource,
  runTests,
};
