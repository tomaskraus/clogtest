const Debug = require("debug");

const appLog = Debug("clogtest");

/**
 * Returns leading spaces of a string.
 * @param {string} str input string
 * @returns {string} Leading white spaces of a string (tabs & space). Empty string if the argument has no leading spaces.
 */
const getPaddingStr = (str) => {
  let s = "";
  for (let i = 0; i < str.length; i++) {
    ch = str.charAt(i);
    if (ch !== " " && ch !== "\t") break;
    s += ch;
  }
  return s;
};

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

module.exports = {
  appLog,
  getPaddingStr,
  safeRunner,
};
