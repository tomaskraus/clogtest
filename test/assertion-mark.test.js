const engineFn = require("../src/engine");

const { doTests, getStats } = engineFn();

test("Cannot be fooled with printed assertion mark.", async () => {
  const [results] = await doTests("./test/inputs/print-assertion-mark.js");
  const { totalCount, failedCount } = getStats(results);
  expect(totalCount).toEqual(5);
  expect(failedCount).toEqual(0);
});
