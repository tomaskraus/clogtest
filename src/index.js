const { doTestsAndPrintResults } = require("./main");

const { Command } = require("commander");

const program = new Command();
program
  .name("clogtest")
  .argument("<file>", "a javascript file with a code to be run")
  .description(
    "Runs the code and tests its console.log's output againts expected values written in the special comments in the code."
  )
  .addHelpText(
    "after",
    `example: 
    clogtest ./examples.js
    `
  )
  .showHelpAfterError()
  .action(async (file) => {
    const retCode = await doTestsAndPrintResults(file);
    if (retCode !== 0) process.exit(retCode);
  });

program.parse();
