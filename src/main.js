/**
 * A facade that provides business and presentation logic to the CLI.
 * Uses the engine and reports to the console stdout, stderr.
 */

const fs = require("fs/promises");

const engine = require("./engine.js")();
const { printFails, printResume, out } = require("./report.js");
const { appLog } = require("./utils.js");
const log = appLog.extend("main");

const appName = require("../package.json").name;

// ------------------

const printHeader = (action, fileName) => {
  out(`${appName} ${action}: ${fileName}`);
};

const doTestsAndPrintResults = async (fileName, tsFileName = null) => {
  log(`doTestsAndPrintResults: START ---------`);
  printHeader("test", engine.srcName(fileName, tsFileName));
  const [allResults, source] = await engine.doTests(fileName, tsFileName);
  const fails = allResults.filter(engine.failedResultPredicate);
  printFails(fails, engine.srcName(fileName, tsFileName), source);
  printResume(engine.getStats(allResults));
  log(`doTestsAndPrintResults: END - - - - -`);
  return fails.length === 0 ? 0 : 1;
};

const writeAssertions = async (fileName, tsFileName = null) => {
  log(`writeAssertions: START ----------`);

  const printLineHandler = (fileName, lineNumber, line) =>
    out(`\t${fileName}:${lineNumber}\t${line.trim()}`);

  const sourceFileName = engine.srcName(fileName, tsFileName);
  printHeader("write-assertions", sourceFileName);
  const [content, assertionsFilledCount] = await engine.fillAssertions(
    fileName,
    tsFileName,
    printLineHandler
  );
  out(`${assertionsFilledCount} assertion comment(s) written.`);
  if (assertionsFilledCount > 0) {
    log(`Writing filled assertions to [${sourceFileName}}]`);
    await fs.writeFile(sourceFileName, content.join("\n"));
  }
  log(`writeAssertions: END - - - - -`);
};

module.exports = {
  doTestsAndPrintResults,
  writeAssertions,
};
