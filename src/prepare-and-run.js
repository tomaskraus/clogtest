/**
 * prepares the data for tests
 */

const { appLog } = require("./shared.js");
const log = appLog.extend("prep-and-run");

const fs = require("fs/promises");
const Path = require("path");

window = {}; // NodeJS hack for console-redirect
const redirect = require("console-redirect");
const streamBuffers = require("stream-buffers");
const process = require("node:process");

const loadInputFile = async (fileName) => {
  log(`opening input file [${fileName}]`);
  const data = await fs.readFile(fileName, { encoding: "utf-8" });
  return data.split("\n");
};

const createFileWithInjectedPrints = async (
  testMark,
  inputFileName,
  inputFileLines
) => {
  const parsedPath = Path.parse(inputFileName);
  const injectedFileName = Path.normalize(
    Path.join(parsedPath.dir, `.clogtest.${parsedPath.name}${parsedPath.ext}`)
  );
  log(`creating injected file [${injectedFileName}]`);

  const injectedContent = inputFileLines
    .reduce((acc, line) => {
      acc.push(line);
      if (line.startsWith(testMark)) {
        acc.push(`console.log('${testMark}')`);
      }
      return acc;
    }, [])
    .join("\n");
  await fs.writeFile(injectedFileName, injectedContent);
  log(`createFileWithInjectedPrints saved into [${injectedFileName}]`);
  return injectedFileName;
};

const runFileAndGatherOutput = (fileName) => {
  log(`runFile [${fileName}]`);
  const buff = new streamBuffers.WritableStreamBuffer();
  const myConsole = redirect(buff, process.stderr, true);

  try {
    require(process.cwd() + Path.sep + fileName);
  } finally {
    myConsole.release();
    buff.end();
  }
  log(`runFile output size [${buff.size()}]`);
  return buff.getContentsAsString() || "";
};

const groupOutputByAssertions = (testMarkStr, output) => {
  const [_, groups] = output.split("\n").reduce(
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
  const withRestoredEOLs = s.replace(/(\\n)/g, "\n");
  return withRestoredEOLs.slice(testMark.length).trim();
};

/**
 *
 * @param {*} testMarkStr
 * @param {*} outputGroups
 * @param {*} inputFileLines
 * @returns [{lineNumber: number, expected: string, received: string}]
 */
const createTestInputs = (testMarkStr, outputGroups, inputFileLines) => {
  lineNumber = 1;
  groupIndex = 0;
  const testInputs = inputFileLines
    .map((line) => ({
      expected: line.trim(),
      lineNumber: lineNumber++,
    }))
    .filter((item) => item.expected.startsWith(testMarkStr))
    .map((item) => ({
      ...item,
      expected: prepareAssertionStr(testMarkStr, item.expected),
      received: outputGroups[groupIndex++] || "",
    }));
  log(`testInput item count [${testInputs.length}]`);
  return testInputs;
};

const createTestInputsAndInput = async (testMarkStr, fileName) => {
  const input = await loadInputFile(fileName);
  const injectedFileName = await createFileWithInjectedPrints(
    testMarkStr,
    fileName,
    input
  );
  const output = runFileAndGatherOutput(injectedFileName);
  const groups = groupOutputByAssertions(testMarkStr, output);
  const testInputs = createTestInputs(testMarkStr, groups, input);
  return [testInputs, input];
};

module.exports = {
  loadInputFile,
  createFileWithInjectedPrints,
  runFileAndGatherOutput,
  groupOutputByAssertions,
  createTestInputs,
  createTestInputsAndInput,
};
