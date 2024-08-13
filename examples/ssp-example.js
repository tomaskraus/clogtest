// We expect the output to be 2
console.log(1 + 1);
//=> 2

// can handle true, false, null & undefined
console.log(1 + 1 === 2);
//=> true

// enclose the pattern in double quotes to match leading and/or trailing spaces
console.log(" hello ");
//=> " hello "

// Assertion body cannot be empty.
// Use the "" pattern to match the empty output
console.log("  ".trim());
//=> ""

// escape the first double quote to cancel the special meaning of outermost double quotes
console.log('"TADAA!"');
//=> \"TADAA!"
console.log('""');
//=> \""

// Here, we only write the beginning of what we expect to be the output
console.log("abcd".split(""));
//=> [ 'a', 'b' ...

// What the end of the output should look like (including the space at the end.)
console.log("Thats All! ");
//=> ... "All! "

// What the (possibly multi-line) output should contain
console.log("Line: 155 \nError: Division by zero!");
//=> ... zero ...

// In the assertion body,
// we can describe common special characters using escape sequences
console.log("a" + String.fromCharCode(9) + "1"); //tab has charCode 9
//=> a\t1

// And yes we can go beyond the ASCII:
console.log("絵文字: 😀.");
//=> 絵文字: 😀.
