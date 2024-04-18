const { doTestsAndPrintResults } = require("./main");

const { Command } = require("commander");

const program = new Command();
program.name("clogtest").showHelpAfterError();

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
  .action(async (program) => {
    process.exitCode = await doTestsAndPrintResults(program);
  });

program.parse();
