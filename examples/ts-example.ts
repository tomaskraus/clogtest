const inverse = (a: number) => {
  if (a === 0) {
    throw new Error("Cannot inverse a zero!");
  }
  return 1 / a;
};

console.log(inverse(1));
//=> 1

console.log(inverse(3));
//=> 0.333 ...

try {
  console.log(inverse(0));
} catch (err) {
  if (err instanceof Error) {
    console.log(err.message);
    //=> ... zero ...
  }
}
