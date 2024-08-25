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
const { default: test } = require("node:test");
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

const getInjectedFileName = (fileName) => {
  const parsedPath = Path.parse(fileName);
  return Path.normalize(
    Path.join(parsedPath.dir, `.clogtest.${parsedPath.name}${parsedPath.ext}`)
  );
};

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
  const injectedFileName = getInjectedFileName(inputFileName);
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
  let error = null;
  const buff = new streamBuffers.WritableStreamBuffer();
  const myConsole = redirect(buff, process.stderr, true);

  try {
    require(Path.join(process.cwd(), fileName));
  } catch (err) {
    error = err;
    console.log(err.message);
  } finally {
    myConsole.release();
    buff.end();
  }
  const outputLines = (buff.getContentsAsString() || "").split("\n");
  log(`runSourceAndGatherOutputLines: [${outputLines.length}] lines`);
  log(outputLines);
  return [outputLines, error];
};

/**
 *
 * @param {string} splitMark
 * @param {string[]} outputLines
 * @returns {[string[], string]}
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
  log(`groupOutputBySplitMarks item count [${groups.length}]`);
  log(groups);
  log(`groupOutput rest: [${restOutput}]`);
  return [groups, restOutput];
};

const prepareAssertionStr = (assertionMark, s) => {
  return s.slice(assertionMark.length).trim();
};

/**
 *
 * @param {string} assertionMarkStr
 * @param {string[]} outputGroups
 * @param {string[]} sourceLines
 * @returns {object[]} [{lineNumber: number, linePadding: string, expected: string, received: string, skip: boolean}]
 */
const createTestInputs = (
  assertionMarkStr,
  outputGroups,
  restOutput,
  sourceLines,
  errorFromInput
) => {
  const ASSERTION_MARK_SKIP = assertionMarkStr + SKIP_MARK;
  lineNumber = 1;
  groupIndex = 0;
  const isInCommentBlock = createBlockCommentPredicate();
  const testInputs = sourceLines
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
    .map((item) => {
      return {
        ...item,
        expected: prepareAssertionStr(assertionMarkStr, item.expected),
        received: outputGroups[groupIndex++], // group count is always less or equals assertion Mark count
      };
    });

  if (testInputs.length === outputGroups.length && errorFromInput) {
    // the last output item is an error one
    testInputs.push({
      error: new Error(
        "There is an error thrown which is not checked against any assertion: \n\n" +
          restOutput
      ),
      lineNumber: -1,
    });
  }

  // if there is more assertions in the source than outputGroups count, use the rest parameter
  const itemsUndefinedReceived = testInputs.filter(
    (item) => item.received === undefined
  );
  if (itemsUndefinedReceived.length > 0) {
    //does work because of shallow copy
    itemsUndefinedReceived[0].received = restOutput;
  }

  const itemsUndefinedReceived2 = testInputs.filter(
    (item) => item.received === undefined
  );
  // look for error that was thrown before all assertion marks were consumed
  if (itemsUndefinedReceived2.length > 0) {
    const lastWhichReceives =
      testInputs[testInputs.length - 1 - itemsUndefinedReceived2.length];
    testInputs.push({
      lineNumber: lastWhichReceives.lineNumber,
      error: new Error(
        `The source has ended prematurely, with no test inputs for remaining assertions. Probably an Error was thrown and not caught. 
  Source's last output was before the line [${lastWhichReceives.lineNumber}]: 
  
  ${lastWhichReceives.received}`
      ),
    });
  }

  log(`createTestInputs item count [${testInputs.length}]`);
  return testInputs;
};

const createUniqueSplitMark = () => {
  return "^" + crypto.randomUUID();
};

/**
 *
 * @param {{assertionMark, keepTempFile}} options
 * @param {string} fileName
 * @param {string?} tsFileName
 * @returns {Promise<[[object], [string]]>}
 */
const getTestInputAndSource = async (
  { assertionMark, keepTempFile },
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
      assertionMark,
      splitMark,
      fileName,
      input
    );
    const [output, error] = runSourceAndGatherOutputLines(
      splitMarkInjectedFileName
    );
    const [groups, rest] = groupOutputBySplitMarks(splitMark, output);
    const source = tsInput || input;
    const testInputs = createTestInputs(
      assertionMark,
      groups,
      rest,
      source,
      error
    );
    return [testInputs, source];
  } finally {
    if (splitMarkInjectedFileName && !keepTempFile) {
      log(`  deleting temporary file [${splitMarkInjectedFileName}] ...`);
      await fs.rm(splitMarkInjectedFileName);
      log(`  ... deleted: [${splitMarkInjectedFileName}]`);
    } else {
      log(`  keep temporary file [${splitMarkInjectedFileName}]`);
    }
  }
};

// ----------------------------------------------------------------

const testOneItem = ({ lineNumber, expected, received, skip, error }) => {
  log(
    `  testOneItem  [${lineNumber}] pattern:[${expected}] output:[${received}] ${skip ? "--SKIPPED--" : ""}`
  );

  let pass = false;
  try {
    if (!error) {
      pass = new SSP(expected).test(received);
    }
  } catch (err) {
    error = err;
  }
  return {
    lineNumber,
    expected,
    received,
    pass,
    error,
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
  getInjectedFileName,
};
