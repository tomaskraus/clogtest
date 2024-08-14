// in general, an assertion gets accumulated output:
console.log(1);
console.log(2);
//=> 1\n2

// failure #1: underused assertion
console.log(1);
console.log(2);
//=> 2

// failure #2: underused assertion
console.log(3);
console.log(4);
//=> 3
