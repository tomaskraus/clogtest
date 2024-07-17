const SSP = require("simple-string-pattern").default;
const { appLog } = require("./shared.js");
const log = appLog.extend("test-and-report");
const chalk = require("chalk");

const out = console.error;

// maximum length of patterns created from output
const MAX_OUTPUT_PATTERN_LENGTH = 60;

// testResult = { pass: boolean, lineNumber: number, expected: string, received: string }

const testOneItem = ({ lineNumber, expected, received }) => {
  log(`testOneItem  [${lineNumber}] [${expected}] [${received}]`);

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

const runTests = (testInputs) => {
  log(`runTests running [${testInputs.length}] test(s)`);
  const allResults = testInputs.map(testOneItem);
  return [allResults, allResults.filter((t) => !t.pass)];
};

const printResults = (results, fails, inputFileName, inputLines) => {
  log(`printResults for file [${inputFileName}]`);
  // console.log("inputLines: ", inputLines);
  fails.map(printFail(inputFileName, inputLines));
  printResume(fails.length, results.length);
};

const cerr = chalk.red;
const cok = chalk.green;
const csh = chalk.blue;

const printSourceLinesAround = (lines, paddingStr, lineNumber) => {
  const NUM_LINES_BEFORE = 2;
  const NUM_LINES_AFTER = 1;
  const start = Math.max(lineNumber - 1 - NUM_LINES_BEFORE, 0);
  const end = Math.min(lineNumber + NUM_LINES_AFTER, lines.length);

  for (let i = start; i < end; i++) {
    out(
      `${paddingStr}${i + 1 === lineNumber ? ">" : " "}${(i + 1).toString().padStart(5)} | ${lines[i]}`
    );
  }
};

const printFail =
  (inputFileName, inputFileLines) =>
  ({ lineNumber, expected, received, errMsg }) => {
    if (!errMsg) {
      const exppatt = new SSP(expected);
      const recpatt = SSP.parse(received);

      out(`${cerr("●")} ${csh(inputFileName + ":" + lineNumber)}`);
      out(`  Expected: \t${exppatt.value()}`);
      out(
        `  Received: \t${recpatt.limitPatternLen(MAX_OUTPUT_PATTERN_LENGTH).value()}`
      );
    } else {
      out(`${cerr("!!!")} ${csh(inputFileName + ":" + lineNumber)}`);
      out(`${cerr("Error")}: ${errMsg}`);
    }
    out("");
    printSourceLinesAround(inputFileLines, "    ", lineNumber);
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
