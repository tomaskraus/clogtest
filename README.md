## clogtest

**Console-log-test**, or **clogtest** is a command line application for testing output assertions.  
It runs a javascript file and tests a match between file's output and patterns written in the special comments (`//=>`) in that file.

_Clogtest's_ main purpose is to test code examples before they're copy-pasted to the documentation.

1. having an `examples.js` script file, we want to ensure the script prints the desired output:

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

Those values in (`//=>`) comments are written using a [Simple string pattern](https://github.com/tomaskraus/simple-string-pattern) (a.k.a. **SSP**) syntax.  
**SSP** expressions are much simpler to read and write than [Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions).

2. run `clogtest` on it:

```
$ npx clogtest test examples.js
```

3. see the clogtest's result:

```
clogtest test: examples.js
● examples.js:3
  Pattern:                      [1, 2, 3, 4, 5]
  does not match the output:    [ 2, 4, 6, 8, 10 ]

         1 | const result = [1, 2, 3, 4, 5].map((i) => 2 * i);
         2 | console.log(result);
    >    3 | //=> [1, 2, 3, 4, 5]
         4 |

● examples.js:6
  Pattern:                      " Wo"
  does not match the output:     W

         3 | //=> [1, 2, 3, 4, 5]
         4 |
         5 | console.log("Hello World".substring(5, 7));
    >    6 | //=> " Wo"
         7 |

● examples.js:12
  Pattern:                      null
  does not match the output:    undefined

         9 | //=> 2
        10 |
        11 | console.log({}.append);
    >   12 | //=> null
        13 |

Tests:  3 failed, 1 passed, 4 total
```

In this case, we decided the script behaves correctly but we've made wrong assumptions about its output. Let's fix them manually:

4. fix assertions in `examples.js`

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
$ npx clogtest test examples.js
```

6. view the new result:

```
clogtest test: examples-ok.js
Tests:  4 passed, 4 total
```

7. Hurrah🙂

## Installation

```bash
$ npm i --save-dev clogtest
```

or globally:

```bash
$ npm i -g clogtest
```

## How It Works

Someone may find some similarities between _clogTest_ and Python's [doctest](https://docs.python.org/3/library/doctest.html), but _clogtest_ has a different purpose.
