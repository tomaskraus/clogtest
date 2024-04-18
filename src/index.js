const { doTestsAndPrintResults } = require("./main");

const { Command } = require("commander");

const program = new Command();
program.name("clogtest");

program
  .command("test")
  .alias("t")
  .argument("<program>", "a javascript file with a code to be run")
  .description(
    "Tests program's output against program's assertion comment's values."
  )
  .addHelpText(
    "after",
    `example: 
    clogtest test ./examples.js
    `
  )
  .showHelpAfterError()
  .action(async (program) => {
    const retCode = await doTestsAndPrintResults(program);
    if (retCode !== 0) process.exit(retCode);
  });

program.parse();
