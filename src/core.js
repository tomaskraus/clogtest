/**
 * Building blocks for ClogTest API.
 */
const fs = require("fs/promises");
const Path = require("path");
const process = require("node:process");

const streamBuffers = require("stream-buffers");
window = {}; // NodeJS hack for console-redirect
const redirect = require("console-redirect");

const { switchTrueFalse, nthElementAfter } = require("stateful-predicates");
const SSP = require("simple-string-pattern").default;

const { appLog, getPaddingStr } = require("./utils.js");
const log = appLog.extend("core");

const SKIP_MARK = "#";

/**
 *
 * @param {string} fileName
 * @returns {Promise<string[]>}
 */
const loadInputFileLines = async (fileName) => {
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
 * @param {string} splitMark
 * @param {string} inputFileName
 * @param {[string]} inputFileLines
 * @returns {Promise<string>} a name of a newly created file
 */
const createFileWithInjectedSplitPrints = async (
  splitMark,
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
        if (line.trimStart().startsWith(splitMark)) {
          acc.push(`console.log('${splitMark}')`);
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
 * @param {string} splitMark
 * @param {[string]} outputLines
 * @returns {[string]}
 */
const groupOutputBySplitMarks = (splitMark, outputLines) => {
  const [_, groups] = outputLines.reduce(
    ([currentOutputStr, outputArr], line) => {
      if (line.startsWith(splitMark)) {
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
 * @param {string[]} outputGroups
 * @param {string[]} inputFileLines
 * @returns {object[]} [{lineNumber: number, linePadding: string, expected: string, received: string, skip: boolean}]
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
    }))
    .map((item) => ({
      ...item,
      skip: item.expected.startsWith(SKIP_MARK),
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
  const input = await loadInputFileLines(fileName);
  let tsInput = null;
  let splitMarkInjectedFileName = null;
  if (tsFileName) {
    log(`typeScript file requested: [${tsFileName}]`);
    tsInput = await loadInputFileLines(tsFileName);
  }
  try {
    splitMarkInjectedFileName = await createFileWithInjectedSplitPrints(
      testMarkStr,
      fileName,
      input
    );
    const output = runSourceAndGatherOutputLines(splitMarkInjectedFileName);
    const groups = groupOutputBySplitMarks(testMarkStr, output);
    const source = tsInput || input;
    const testInputs = createTestInputs(testMarkStr, groups, source);
    return [testInputs, source];
  } finally {
    if (splitMarkInjectedFileName) {
      log(`deleting temporary file [${splitMarkInjectedFileName}] ...`);
      await fs.rm(splitMarkInjectedFileName);
      log(`... deleted: [${splitMarkInjectedFileName}]`);
    }
  }
};

// ----------------------------------------------------------------

const testOneItem = ({ lineNumber, expected, received, skip }) => {
  log(
    `  testOneItem  [${lineNumber}] ssp:[${expected}] input:[${received}] ${skip ? "--SKIPPED--" : ""}`
  );

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
    skip,
  };
};

/**
 *
 * @param {object[]} testInputs [{lineNumber: number, expected: string, received: string, pass: boolean, skip: boolean}]
 * @returns {object[]} all tests (including skipped ones)
 */
const runTests = (testInputs) => {
  log(`runTests running [${testInputs.length}] test(s)`);
  const allResults = testInputs.map(testOneItem);
  const fails = allResults.filter((t) => !t.pass);
  log(`Results: all [${allResults.length}], fails [${fails.length}]`);
  return allResults;
};

module.exports = {
  getTestInputAndSource,
  runTests,
};
