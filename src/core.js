/**
 * Building blocks for ClogTest API.
 */
const fs = require("fs/promises");
const Path = require("path");
const process = require("node:process");
const crypto = require("crypto");

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
  assertionMark,
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
        if (line.trimStart().startsWith(assertionMark)) {
          acc.push(`console.log('${splitMark}')`);
        }
      }
      return acc;
    }, [])
    .join("\n");
  await fs.writeFile(injectedFileName, injectedContent);
  log(`createFileWithInjectedSplitPrints saved into [${injectedFileName}]`);
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
    require(Path.join(process.cwd(), fileName));
  } catch (err) {
    console.log(err.message);
  } finally {
    myConsole.release();
    buff.end();
  }
  const outputLines = (buff.getContentsAsString() || "").split("\n");
  log(`runSourceAndGatherOutputLines: [${outputLines.length}] lines`);
  log(outputLines);
  return outputLines;
};

/**
 *
 * @param {string} splitMark
 * @param {[string]} outputLines
 * @returns {[string]}
 */
const groupOutputBySplitMarks = (splitMark, outputLines) => {
  let accMem = "";
  const [_1, groups, _2] = outputLines.reduce(
    ([currentOutputStr, outputArr, isStart], line) => {
      if (line.startsWith(splitMark)) {
        outputArr.push(currentOutputStr);
        return ["", outputArr, true];
      }
      currentOutputStr += isStart ? line : "\n" + line;
      accMem = currentOutputStr;
      return [currentOutputStr, outputArr, false];
    },
    ["", [], true]
  );
  const restOutput = accMem.trim();
  if (restOutput !== "" || groups.length === 0) {
    groups.push(restOutput);
  }
  log(`groupOutputBySplitMarks item count [${groups.length}]`);
  log(groups);
  return groups;
};

const prepareAssertionStr = (assertionMark, s) => {
  return s.slice(assertionMark.length).trim();
};

/**
 *
 * @param {string} assertionMarkStr
 * @param {string[]} outputGroups
 * @param {string[]} inputFileLines
 * @returns {object[]} [{lineNumber: number, linePadding: string, expected: string, received: string, skip: boolean}]
 */
const createTestInputs = (assertionMarkStr, outputGroups, inputFileLines) => {
  const ASSERTION_MARK_SKIP = assertionMarkStr + SKIP_MARK;
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
        item.expected.startsWith(assertionMarkStr)
    )
    .map((item) => ({
      ...item,
      skip: item.expected.startsWith(ASSERTION_MARK_SKIP),
    }))
    .map((item) => ({
      ...item,
      expected: prepareAssertionStr(assertionMarkStr, item.expected),
      received: outputGroups[groupIndex++], // groups are at least as many as assertion Marks
    }));
  log(`createTestInputs item count [${testInputs.length}]`);
  return testInputs;
};

/**
 *
 * @param {string} assertionMarkStr
 * @param {string} fileName
 * @param {string?} tsFileName
 * @returns {Promise<[[object], [string]]>}
 */
const getTestInputAndSource = async (
  assertionMarkStr,
  fileName,
  tsFileName
) => {
  const input = await loadInputFileLines(fileName);
  let tsInput = null;
  let splitMarkInjectedFileName = null;
  log("getTestInputAndSource:");
  if (tsFileName) {
    log(`  typeScript file requested: [${tsFileName}]`);
    tsInput = await loadInputFileLines(tsFileName);
  }
  try {
    const splitMark = createUniqueSplitMark();
    splitMarkInjectedFileName = await createFileWithInjectedSplitPrints(
      assertionMarkStr,
      splitMark,
      fileName,
      input
    );
    const output = runSourceAndGatherOutputLines(splitMarkInjectedFileName);
    const groups = groupOutputBySplitMarks(splitMark, output);
    const source = tsInput || input;
    const testInputs = createTestInputs(assertionMarkStr, groups, source);
    return [testInputs, source];
  } finally {
    if (splitMarkInjectedFileName) {
      log(`  deleting temporary file [${splitMarkInjectedFileName}] ...`);
      await fs.rm(splitMarkInjectedFileName);
      log(`  ... deleted: [${splitMarkInjectedFileName}]`);
    }
  }
};

const createUniqueSplitMark = () => {
  return "^" + crypto.randomUUID();
};

// ----------------------------------------------------------------

const testOneItem = ({ lineNumber, expected, received, skip }) => {
  log(
    `  testOneItem  [${lineNumber}] pattern:[${expected}] output:[${received}] ${skip ? "--SKIPPED--" : ""}`
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
