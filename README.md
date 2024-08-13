# clogtest

**Console-log-test**, or **clogtest** is a command line application for testing output assertions.  
It runs a _javascript_ or even a _TypeScript_ file and tests a match between file's output and patterns written in the special comments (`//=>`) in that file.

_Clogtest's_ main purpose is to test code examples before they're copy-pasted to the documentation.

## Example

1. having an `example.js` script file in a `examples` directory, we want to ensure the script prints the desired output:

```js
const result = [1, 2, 3, 4, 5].map((i) => 2 * i);
console.log(result);
//=> [1, 2, 3, 4, 5]

console.log("Hello World".substring(5, 7));
//=> " Wo"

console.log(1 + 1);
//=> 2

console.log({}.append);
//=> null
```

Those values in (`//=>`) comments are written using a [Simple String Pattern][1] (a.k.a. **SSP**) syntax.  
**SSP** expressions are much simpler to read and write than [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions).

2. run `clogtest` on it:

```
$ npx clogtest test examples/example.js
```

3. see the clogtest's result:

```
clogtest test: examples/example.js
● examples/example.js:3
  Pattern:                      [1, 2, 3, 4, 5]
  does not match the output:    "[ 2, 4, 6, 8, 10 ]"

         1 | const result = [1, 2, 3, 4, 5].map((i) => 2 * i);
         2 | console.log(result);
    >    3 | //=> [1, 2, 3, 4, 5]
         4 |

● examples/example.js:6
  Pattern:                      " Wo"
  does not match the output:    " W"

         3 | //=> [1, 2, 3, 4, 5]
         4 |
         5 | console.log("Hello World".substring(5, 7));
    >    6 | //=> " Wo"
         7 |

● examples/example.js:12
  Pattern:                      null
  does not match the output:    "undefined"

         9 | //=> 2
        10 |
        11 | console.log({}.append);
    >   12 | //=> null
        13 |

Tests:  3 failed, 1 passed, 4 total
```

In this case, we decided the script behaves correctly but we've made wrong assumptions about its output. Let's fix them manually:

4. fix assertions in `examples/example.js`

```js
const result = [1, 2, 3, 4, 5].map((i) => 2 * i);
console.log(result);
// We can use a short notation (...) to write
// only the part of the expected output
//=> [ 2, 4, 6, ...

console.log("Hello World".substring(5, 8));
//=> " Wo"

console.log(1 + 1);
//=> 2

console.log({}.append);
//=> undefined
```

5. run `clogtest` tool again:

```
$ npx clogtest test examples/example.js
```

6. view the new result:

```
clogtest test: examples/example.js
Tests:  4 passed, 4 total
```

7. Hurrah🙂

## On Assertions

**clogtest** CLI app runs the _source file_ from command line argument and looks for those line comments beginning with `//=>`. These special line comments are called _Assertions_.

The _Assertion_ consists of _Assertion Mark_ (that `//=>` string) and _Assertion Body_, which must be a valid _Simple string pattern_ a.k.a. SSP (don't be worry, SSP format is very easy).

Clogtest tests output of the _source file_ against body parts of its _Assertions_.

Example:

```js
//=> this is it
```

The above example shows an assertion line with a body "this is it".  
This body is a valid _Simple string pattern_ and the Assertion expects output to exactly match the string "this is it".

> **Note**: Every _Assertion_ occupies exactly one line in the file.

## More Examples

Here are some SSP (Simple String Pattern) examples in the `//=>` assertions

```js
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
```

We can create assertion that does match a computed multi-line output:

```js
for (let i = 1; i < 4; i++) {
  console.log(`#${i}`);
}
//=> #1\n#2\n#3

// note that the End Of Line character is not present at the very end of an output. Clogtest strips the output for our convenience.
```

For more about SSP format, see [Simple String Pattern documentation][1].

## TypeScript

You can also test `.ts` files! The only thing **clogtest** needs to know is where the corresponding generated javascript files are. Use the clogtest's `--jsDir` option for that:

```
$ npx clogtest test --jsDir dist examples/ts-example.ts
```

By default, clogtest assumes the javascript files resides in the `dist` subdirectory in clogtest's current working dir. So, for most of the time, you don't need to even specify the `--jsDir` option.> **Note**: Only the _Pattern Body_ is matched against the input

## On Minified Javascript Files

Clogtest may not work properly with minified and/or uglified \*.js files as clogtest's assertions (as well as other comments) could be removed during a minification/uglification process.

## Test Error-throwing Code

**clogtest** can also test a code that throws an Error:

```js
JSON.parse("abc");
//=> Unexpected token ...
```

However, once an Error is thrown (without a catch), **clogtest** is not able to test subsequent assertions in that file:

```js
// following output meets the assertion below:
console.log(123);
//=> 123

// output of the first error thrown meets the assertion below:
JSON.parse("abc");
//=> Unexpected token ...

// because of an uncaught Error thrown, following code is not executed, so no further output is available to the clogtest tool

// following output is undefined, so the (otherwise truthy) assertion below fails:
console.log("hi");
//=> hi
```

Should you test more errors thrown in one file, catch those errors and print them in the catch code block:

```js
try {
  throw new Error("failure");
} catch (err1) {
  console.log(err1.message);
  //=> failure
}

try {
  JSON.parse("abc");
} catch (err2) {
  console.log(err2.message);
  //=> Unexpected token ...
}
```

## Installation

```bash
$ npm i --save-dev clogtest
```

or globally:

```bash
$ npm i -g clogtest
```

[1]: https://github.com/tomaskraus/simple-string-pattern
[2]: https://www.npmjs.com/package/markdown-doctest
[3]: https://byexamples.github.io/byexample/languages/javascript
