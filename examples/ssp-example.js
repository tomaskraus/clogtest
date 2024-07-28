// We expect the output to be 2
console.log(1 + 1);
//=> 2

console.log(1 + 1 === 2);
//=> true

// Here, we only write the beginning of what we expect to be the output
console.log("abcd".split(""));
//=> [ 'a', 'b' ...

// What the end of the output should look like (including the space at the end.)
console.log("Thats All! ");
//=> ... "All! "

// What the (possibly multi-line) output should contain
console.log("Line: 155 \nError: Division by zero!");
//=> ... zero ...

// In the expected output,
// we can describe common special characters using escape sequences
console.log("a" + String.fromCharCode(9) + "1");
//=> a\t1

// And yes we can go beyond the ASCII:
console.log("絵文字: 😀.");
//=> 絵文字: 😀.
