## clogtest

**Console-log-test**, or **clogtest** is a command line application for testing output assertions.  
It runs a javascript file and tests its standard output againts expected values written in the special comments (`//=>`) in that file.

_Clogtest's_ main purpose is to test code examples before they're copy-pasted to the documentation.

1. having an `examples.js` file:

```js
const result = [1, 2, 3, 4, 5].map((i) => 2 * i);
console.log(result);
//=> [1,4,6 ...

console.log("Hello World".substring(5, 7));
//=> " Wo"

console.log(1 + 1);
//=> 2

console.log({}.append);
//=> null
```

2. run `clogtest` on it:

```bash
$ npx clogtest ./examples.js
```

3. see the result:

```
clogtest ./examples.js
● ./examples.js:3
  Expected:     [1,4,6...
  Received:     [2,4,6,8,10]

         1 | const result = [1, 2, 3, 4, 5].map((i) => 2 * i);
         2 | console.log(result);
    >    3 | //=> [1,4,6 ...
         4 |

● ./examples.js:6
  Expected:     " Wo"
  Received:     " W"

         4 |
         5 | console.log("Hello World".substring(5, 7));
    >    6 | //=> " Wo"
         7 |

● ./examples.js:12
  Expected:     null
  Received:     undefined

        10 |
        11 | console.log({}.append);
    >   12 | //=> null
        13 |

Tests:  3 failed, 1 passed, 4 total
```

4. fix the code in `./examples.js`

```js
const result = [1, 2, 3, 4, 5].map((i) => 2 * i);
console.log(result);
//=> [2,4,6 ...

console.log("Hello World".substring(5, 8));
//=> " Wo"

console.log(1 + 1);
//=> 2

console.log({}.append);
//=> undefined
```

5. run again:

```bash
$ npx clogtest ./examples.js
```

6. view new result:

```
clogtest ./examples-ok.js
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

Someone may find some similarities between _ClogTest_ and Python's [doctest](https://docs.python.org/3/library/doctest.html), but _clogtest_ has a different purpose and different internal workflow.
