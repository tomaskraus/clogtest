const SSP = require("simple-string-pattern").default;
const { appLog } = require("./shared.js");
const log = appLog.extend("test-and-report");
const chalk = require("chalk");
const { escape } = require("safe-string-literal");

// TestResultType = {
//   lineNumber: number,
//   expected: string,
//   received: string,
//   pass: boolean,
//   errMsg?: string,
// };

const testOneItem = ({ lineNumber, expected, received }) => {
  log(`testOneItem  [${lineNumber}] ssp:[${expected}] input:[${received}]`);

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
  return [allResults, allResults.filter((t) => !t.pass)];
};

// --------------------------------------------------------------

const out = console.error;

const limitAndEscape = (str) => {
  const MAX_OUTPUT_BODY_LENGTH = 60;
  const norm = escape(str, "'\"`");
  return norm.length > MAX_OUTPUT_BODY_LENGTH
    ? norm.slice(0, MAX_OUTPUT_BODY_LENGTH) + " ..."
    : norm;
};

/**
 *
 * @param {[object]} results
 * @param {[object]} fails
 * @param {string} inputFileName
 * @param {[string]} outputLines
 */
const printResults = (results, fails, inputFileName, outputLines) => {
  log(`printResults for file [${inputFileName}]`);
  // console.log("inputLines: ", inputLines);
  fails.map(printFail(inputFileName, outputLines));
  printResume(fails.length, results.length);
};

const cerr = chalk.red;
const cok = chalk.green;
const csh = chalk.blue;
const csw = chalk.white.bold;

const printSourceLinesAround = (lines, paddingStr, lineNumber) => {
  const NUM_LINES_BEFORE = 3;
  const NUM_LINES_AFTER = 1;
  const start = Math.max(lineNumber - 1 - NUM_LINES_BEFORE, 0);
  const end = Math.min(lineNumber + NUM_LINES_AFTER, lines.length);

  for (let i = start; i < end; i++) {
    const isPatternLine = i + 1 === lineNumber;
    const text = `${paddingStr}${isPatternLine ? ">" : " "}${(i + 1).toString().padStart(5)} | ${lines[i]}`;
    out(isPatternLine ? csw(text) : text);
  }
};

const printFail =
  (inputFileName, outputLines) =>
  ({ lineNumber, expected, received, errMsg }) => {
    if (!errMsg) {
      const exppatt = new SSP(expected);

      out(`${cerr("●")} ${csh(inputFileName + ":" + lineNumber)}`);
      out(`  Pattern: \t\t\t${cok(exppatt.value())}`);
      out(`  does not match the output: \t${cerr(limitAndEscape(received))}`);
    } else {
      out(`${cerr("!!!")} ${csh(inputFileName + ":" + lineNumber)}`);
      out(`${cerr("Error")}: ${errMsg}`);
    }
    out("");
    printSourceLinesAround(outputLines, "    ", lineNumber);
    out("");
  };

const printResume = (numberOfFails, numberTotal) => {
  let str = `${numberTotal} total`;
  const numberOfPassed = numberTotal - numberOfFails;
  if (numberOfPassed > 0) {
    str = `${cok.bold(numberOfPassed + " passed")}, ${str}`;
  }
  if (numberOfFails > 0) {
    str = `${cerr.bold(numberOfFails + " failed")}, ${str}`;
  }

  out(`Tests: \t${str}`);
};

module.exports = {
  runTests,
  printResults,
  out,
};
