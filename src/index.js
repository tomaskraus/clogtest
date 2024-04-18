const { doTestsAndPrintResults, writeAssertions } = require("./main");

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
    const retCode = await doTestsAndPrintResults(program);
    if (retCode !== 0) process.exit(retCode);
  });

program
  .command("write")
  .alias("w")
  .argument("<program>", "a javascript file with a code to be run")
  .description(
    "Runs the code and writes corresponding parts of its output to those empty assertion comments (//=>) in the code."
  )
  .addHelpText(
    "after",
    `example: 
    clogtest write ./examples.js
    `
  )
  .action(async (program) => {
    await writeAssertions(program);
  });

program.parse();
