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
    `${parsedPath.dir}${Path.sep}.clogtest.${parsedPath.name}${parsedPath.ext}`
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

const runFileAndGatherOutput = (injectedFileName) => {
  log(`runFile [${injectedFileName}]`);
  const buff = new streamBuffers.WritableStreamBuffer();
  const myConsole = redirect(buff, process.stderr, true);

  try {
    require(`..${Path.sep}` + injectedFileName);
  } finally {
    myConsole.release();
    buff.end();
  }
  log(`runFile output size [${buff.size()}]`);
  return buff.getContentsAsString() || "";
};

const groupOutputByAssertions = (testMark, output) => {
  const [_, groups] = output.split("\n").reduce(
    ([currentOutputStr, outputArr], line) => {
      if (line.startsWith(testMark)) {
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

module.exports = {
  loadInputFile,
  createFileWithInjectedPrints,
  runFileAndGatherOutput,
  groupOutputByAssertions,
};
