/**
 * A facade that provides business logic for a CLI.
 */

const engine = require("./engine.js")();
const { printResults, out } = require("./report.js");
const { appLog } = require("./utils.js");
const log = appLog.extend("main");
const fs = require("fs/promises");

const appName = require("../package.json").name;

const printHeader = (action, fileName) => {
  out(`${appName} ${action}: ${fileName}`);
};

// ------------------

const doTestsAndPrintResults = async (fileName, tsFileName = null) => {
  log(`doTestsAndPrintResults: START ---------`);
  printHeader("test", tsFileName || fileName);
  const [allResults, fails, source] = await engine.doTests(
    fileName,
    tsFileName
  );
  printResults(allResults, fails, tsFileName || fileName, source);
  log(`doTestsAndPrintResults: END - - - - -`);
  return fails.length === 0 ? 0 : 1;
};

const writeAssertions = async (fileName, tsFileName = null) => {
  log(`writeAssertions: START ----------`);

  const printLineHandler = (fileName, lineNumber, line) =>
    out(`\t${fileName}:${lineNumber}\t${line.trim()}`);

  const sourceFileName = tsFileName || fileName;
  printHeader("write-assertions: ", sourceFileName);
  const [content, assertionsFilledCount] = await engine.writeAssertions(
    fileName,
    tsFileName,
    printLineHandler
  );
  out(`${assertionsFilledCount} assertion comment(s) filled`);
  if (assertionsFilledCount > 0) {
    log(`Writing filled assertions to [${tsFileName || fileName}]`);
    await fs.writeFile(tsFileName || fileName, content);
  }
  log(`writeAssertions: END - - - - -`);
};

module.exports = {
  doTestsAndPrintResults,
  writeAssertions,
};
