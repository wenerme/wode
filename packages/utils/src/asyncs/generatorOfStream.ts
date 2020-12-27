export function* generatorOfStream<T = any>(stream: any): IterableIterator<Promise<T>> {
  let done = false;
  stream.on('end', () => {
    done = true;
  });
  while (!done) {
    yield new Promise((resolve, reject) => {
      stream.once('data', resolve);
      stream.once('end', resolve);
      stream.once('error', reject);
    });
  }
}
