/**
 * ClogTest CLI.
 */

const Path = require("path");
const { Command, createOption } = require("commander");

const businessLogicProvider = require("./main");

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
    const code = await asyncFn();
    return code;
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

const customAssertionMarkOption = createOption(
  "-m, --mark <assertionMark>",
  "sets a custom assertion mark"
).default("//=>");

const keepTempFileOption = createOption(
  "-k, --keepTempFile",
  "does not delete temporary .clogtest.*.js file after use"
);

const getBusinessLogicOptions = (options) => ({
  assertionMark: options.mark,
  keepTempFile: options.keepTempFile,
});

// -----------

program
  .command("check")
  .alias("c")
  .argument("<source>", "a javascript file with a code to be run")
  .addOption(jsDirOption)
  .addOption(keepTempFileOption)
  .description("runs the source and checks for errors")
  .addHelpText(
    "after",
    `example: 
    clogtest check ./examples.js
    clogtest check --jsDir dist ./examples/ts-example.ts
    `
  )
  .action(async (source, options) => {
    const businessLogic = businessLogicProvider(
      getBusinessLogicOptions(options)
    );
    process.exitCode = await safeRunner(() =>
      businessLogic.check(
        getJsFileName(source, options.jsDir),
        getSourceFileName(source)
      )
    );
  });

program
  .command("test")
  .alias("t")
  .argument("<source>", "source file with a code to be run")
  .addOption(jsDirOption)
  .addOption(customAssertionMarkOption)
  .addOption(keepTempFileOption)
  .description(
    "runs the source and tests its output against assertions comments (//=>) written in it"
  )
  .addHelpText(
    "after",
    `example: 
    clogtest test ./examples.js
    clogtest test --jsDir dist ./examples/ts-example.ts

    `
  )
  .action(async (source, options) => {
    const businessLogic = businessLogicProvider(
      getBusinessLogicOptions(options)
    );
    process.exitCode = await safeRunner(() =>
      businessLogic.doTestsAndPrintResults(
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
  .addOption(customAssertionMarkOption)
  .addOption(keepTempFileOption)
  .description(
    "runs the source and writes corresponding parts of its output to those empty assertion comments (//=>) in the code source"
  )
  .addHelpText(
    "after",
    `example: 
      clogtest write ./examples.js
      clogtest write --jsDir dist ./examples/ts-example.ts
      `
  )
  .action(async (source, options) => {
    const businessLogic = businessLogicProvider(
      getBusinessLogicOptions(options)
    );
    process.exitCode = await safeRunner(() =>
      businessLogic.writeAssertions(
        getJsFileName(source, options.jsDir),
        getSourceFileName(source)
      )
    );
  });

program.parse();
