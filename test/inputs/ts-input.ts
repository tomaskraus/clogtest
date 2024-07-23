{
  const inverse = (a: number) => {
    if (a === 0) {
      throw new Error("Cannot inverse a zero!");
    }
    return 1 / a;
  };

  console.log(inverse(1));
  //=> 1

  //console.log(inverse(4));
  ////=> 0.25

  console.log(inverse(3));
  //=> 0.3

  try {
    console.log(inverse(0));
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
      //=> ... zero ...
    }
  }
}
