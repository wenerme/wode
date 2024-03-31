export function cartesianProduct<T>(args: T[][]): T[][] {
  if (args.length === 0) return [];

  const product: T[][] = [];
  const counts = args.map((arr) => arr.length);
  const counter = new Array(args.length).fill(0);
  const total = counts.reduce((acc, val) => acc * val, 1);

  for (let i = 0; i < total; i++) {
    product.push(counter.map((count, index) => args[index][count]));

    // Update the counter for the next row in the Cartesian product.
    for (let j = args.length - 1; j >= 0; j--) {
      if (counter[j] + 1 < counts[j]) {
        counter[j]++;
        break; // Stop as we've found a digit that can be incremented.
      } else {
        counter[j] = 0; // Reset this digit and increment the next digit in the next iteration.
      }
    }
  }

  return product;
}
