// in general, an assertion gets accumulated output:
console.log(1);
console.log(2);
//=> 1\n2

// failure #1: underused assertion
console.log(1);
console.log(2);
//=> 1

// failure #2: underused assertion
console.log(1);
console.log(2);
//=> 2

//overused assertion (i.e. without corresponding output)
//=> ""
//=> ""

// back to normal-working assertion:
console.log(123);
//=> 123

// overused assertion again:
//=> ""

// no assertions at the end
console.log(4);
console.log(5);
