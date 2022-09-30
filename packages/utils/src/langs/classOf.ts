export function classOf(o: any) {
  return Object.prototype.toString.call(o).slice(8, -1);
}
