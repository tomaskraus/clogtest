// following output meets the assertion below:
console.log(123);
//=> 123

// output of the first error thrown meets the assertion below:
JSON.parse("abc");
//=> ... not valid JSON

// because of an uncaught Error thrown, following code is not executed, so no further output is available to the clogtest tool

// following output is undefined, so the (otherwise truthy) assertion below fails:
console.log("hi");
//=> hi
