const { looseStringTest, parsePattern, REST_MARK } = require("loose-string-test");
const { appLog } = require("./shared.js");
const log = appLog.extend("test-and-report");
const chalk = require("chalk");

const out = console.error;

const prepareAssertion = (testMark, s) => {
  const withRestoredEOLs = s.replace(/(\\n)/g, "\n");
  return withRestoredEOLs.slice(testMark.length).trim();
};

const createTestInputs = (testMark, outputGroups, inputFileLines) => {
  lineNumber = 1;
  groupIndex = 0;
  const testInputs = inputFileLines
    .map((line) => ({
      expected: line.trim(),
      lineNumber: lineNumber++,
    }))
    .filter((item) => item.expected.startsWith(testMark))
    .map((item) => ({
      ...item,
      expected: prepareAssertion(testMark, item.expected),
      received: outputGroups[groupIndex++] || "",
    }));
  log(`testInput item count [${testInputs.length}]`);
  return testInputs;
};

// testResult = { pass: boolean, lineNumber: number, expected: string, received: string }

const testOneItem = ({ lineNumber, expected, received }) => {
  return {
    lineNumber,
    expected,
    received,
    pass: looseStringTest(expected, received),
  };
};

const runTests = (testInputs) => {
  log(`runTests running [${testInputs.length}] test(s)`);
  return testInputs.map(testOneItem);
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

const printLinesAround = (lines, paddingStr, lineNumber) => {
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
  ({ lineNumber, expected, received }) => {
    const exppatt = parsePattern(expected);
    const recpatt = parsePattern(received);
    const startMark = exppatt.isExactPattern ? '"' : "";
    const endMark = exppatt.isStartPattern ? `${startMark}${REST_MARK}` : startMark;

    out(`${cerr("●")} ${csh(inputFileName + ":" + lineNumber)}`);
    out(`  Expected: \t${startMark}${cok(exppatt.isExactPattern ? exppatt.body : exppatt.stripped)}${endMark}`);
    out(`  Received: \t${startMark}${cerr(exppatt.isExactPattern ? recpatt.body : recpatt.stripped)}${startMark}`);
    out("");
    printLinesAround(inputFileLines, "    ", lineNumber);
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
  createTestInputs,
  runTests,
  printResults,
  out,
};
