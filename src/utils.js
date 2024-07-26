/**
 * Code used across the codebase.
 */

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

module.exports = {
  appLog,
  getPaddingStr,
};
