export function promiseOfCallback<T>(fun: (cb: (err: any, val?: T) => void) => void) {
  return new Promise<T>((resolve, reject) => {
    try {
      fun((e: any, v: any) => {
        if (e) {
          reject(e);
        } else {
          resolve(v);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
