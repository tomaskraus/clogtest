throw new Error("some errors");
//=> ... errors

// because the program already stopped, does not provide output there
console.log(1);
//=> 1

throw new Error("another one");
//=> ... another ...
