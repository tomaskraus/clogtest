// this example was taken and modified from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice

const animals: string[] = ["ant", "bison", "camel", "duck", "elephant"];

console.log(animals.slice(2));
// Expected output:  [ 'camel', 'duck', 'elephant' ]

console.log(animals.slice(2, 4));
// Expected output:  [ 'camel', 'duck' ]

console.log(animals.slice(1, 5));
// Expected output:#  [ 'bison', 'camel', 'duck', 'elephant' ]

console.log(animals.slice(-2));
// Expected output:  [ 'duck', 'elephant' ]

console.log(animals.slice(2, -1));
// Expected output:#  [ 'camel', 'duck' ]

console.log(animals.slice());
// Expected output:#  [ 'ant', 'bison', ...

// ----------------------------------

// test fails
console.log(animals.slice(-2));
// Expected output:  [ 'duck' ]

console.log(animals.slice(-2));
// Expected output:  [ 'duck', 'elephant' ]
