const { doTestsAndPrintResults, writeAssertions } = require("./main");
const { Command, createOption } = require("commander");
const Path = require("path");

// ------------------------------------------

const getJsFileName = (fileName, jsDir = ".") => {
  const extName = Path.extname(fileName);
  if (extName !== ".js") {
    return Path.join(jsDir, fileName.slice(0, -extName.length) + ".js");
  }
  return fileName;
};

const getSourceFileName = (fileName) =>
  !fileName.endsWith(".js") ? fileName : null;

const safeRunner = async (asyncFn) => {
  const DEFAULT_RET_CODE = 1;
  try {
    const result = await asyncFn();
    return result;
  } catch (err) {
    const err2 = new Error(err.message, { cause: err });
    console.log(err2);
    return err2.cause.errno || DEFAULT_RET_CODE;
  }
};

// ---------------------------------------------------------------

const program = new Command();
program.name("clogtest").showHelpAfterError();

const jsDirOption = createOption(
  "-j, --jsDir <dirName>",
  "directory of source's generated javascript file"
).default("dist");

program
  .command("test")
  .alias("t")
  .argument("<source>", "source file with a code to be run")
  .addOption(jsDirOption)
  .description(
    "Tests program's output against assertions comments (//=>) written in the program's source."
  )
  .addHelpText(
    "after",
    `example: 
    clogtest test ./examples.js
    clogtest test --jsDir dist ./examples/ts-example.ts

    `
  )
  .action(async (source, options) => {
    process.exitCode = await safeRunner(
      async () =>
        await doTestsAndPrintResults(
          getJsFileName(source, options.jsDir),
          getSourceFileName(source)
        )
    );
  });

program
  .command("write")
  .alias("w")
  .argument("<source>", "a javascript file with a code to be run")
  .addOption(jsDirOption)
  .description(
    "Runs the code and writes corresponding parts of its output to those empty assertion comments (//=>) in the code source."
  )
  .addHelpText(
    "after",
    `example: 
    clogtest write ./examples.js
    clogtest write --jsDir dist ./examples/ts-example.ts
    `
  )
  .action(async (source, options) => {
    process.exitCode = await safeRunner(
      async () =>
        await writeAssertions(
          getJsFileName(source, options.jsDir),
          getSourceFileName(source)
        )
    );
  });

program.parse();
