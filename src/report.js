/**
 * All about console pretty-print output.
 */

const chalk = require("chalk");
const { escape } = require("safe-string-literal");

const SSP = require("simple-string-pattern").default;

const { appLog } = require("./utils.js");
const log = appLog.extend("report");

// TestResultType = {
//   lineNumber: number,
//   expected: string,
//   received: string,
//   pass: boolean,
//   errMsg?: string,
// };

// --------------------------------------------------------------

/**
 * output
 */
const print = console.error;

const limitAndEscape = (str) => {
  const MAX_OUTPUT_BODY_LENGTH = 60;
  const norm = escape(str, "'\"`");
  return norm.length > MAX_OUTPUT_BODY_LENGTH
    ? norm.slice(0, MAX_OUTPUT_BODY_LENGTH) + " ..."
    : norm;
};

/**
 * Pretty prints failed tests.
 * @param {[object]} fails
 * @param {string} inputFileName
 * @param {[string]} outputLines
 */
const printFails = (fails, outputLines) => {
  log(`printFails:`);
  // console.log("inputLines: ", inputLines);
  fails.map(printFail(outputLines));
  log(`printFails END`);
};

const cerr = chalk.red;
const cwarn = chalk.yellow;
const cok = chalk.green;
const csh = chalk.blue;
const csw = chalk.white.bold;
const cdg = chalk.grey;

const printSourceLinesAround = (lines, paddingStr, lineNumber) => {
  const NUM_LINES_BEFORE = 3;
  const NUM_LINES_AFTER = 1;
  const start = Math.max(lineNumber - 1 - NUM_LINES_BEFORE, 0);
  const end = Math.min(lineNumber + NUM_LINES_AFTER, lines.length);

  for (let i = start; i < end; i++) {
    const isPatternLine = i + 1 === lineNumber;
    const text = `${paddingStr}${isPatternLine ? ">" : " "}${(i + 1).toString().padStart(5)} | ${lines[i]}`;
    print(isPatternLine ? csw(text) : text);
  }
};

const printFail =
  (outputLines) =>
  ({ fileName, lineNumber, expected, received, error }) => {
    const lineInfo =
      csh(fileName) + (lineNumber > 0 ? cdg(":" + lineNumber) : "");
    if (!error) {
      const exppatt = new SSP(expected);

      print(`${cerr("●")} ${lineInfo}`);
      print(`  Pattern: \t\t\t${cok(exppatt.value())}`);
      const receivedOutput =
        typeof received === "undefined"
          ? typeof received
          : `"${cerr(limitAndEscape(received))}"`; // non-undefined values are enclosed in double quotes
      print(`  does not match the output: \t${receivedOutput}`);
    } else {
      print(`${cerr("!!!")} ${lineInfo}`);
      print(`${cerr("Error")}: ${error.message}`);
      // TODO: add stack info
    }
    if (lineNumber > 0) {
      print("");
      printSourceLinesAround(outputLines, "    ", lineNumber);
    }
    print("");
  };

/**
 * Pretty prints results summary
 * @param {statsObj} stats test results summary data
 */
const printResume = (
  { totalCount, skippedCount, passedCount, failedCount },
  customLabel = "Tests"
) => {
  log(`printResume:`);

  let str = `${totalCount} total`;
  if (passedCount > 0) {
    str = `${cok.bold(passedCount + " passed")}, ${str}`;
  }
  if (skippedCount > 0) {
    str = `${cwarn.bold(skippedCount + " skipped")}, ${str}`;
  }
  if (failedCount > 0) {
    str = `${cerr.bold(failedCount + " failed")}, ${str}`;
  }

  print(`${customLabel}: \t${str}`);
  log(`printResume: END`);
};

module.exports = {
  printFails,
  printResume,
  print,
};
