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
