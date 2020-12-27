export type AsyncIntervalIdentifier = any;

export function setAsyncInterval(cb: () => void, interval: number, initial = interval): AsyncIntervalIdentifier {
  let id: any;
  const handler = async () => {
    await cb();
    id = setTimeout(handler, interval);
  };
  id = setTimeout(handler, initial);
  return () => id;
}

export function clearAsyncInterval(v: AsyncIntervalIdentifier) {
  clearTimeout(v?.());
}
