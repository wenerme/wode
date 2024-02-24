import { test, assert } from 'vitest';

test('trim', () => {
  // for https://github.com/wenerme/wener/tree/master/site/patches
  const trim = (v: string) =>
    v
      .replace(/\/([^\/]+)\/([^\/]+)\/\1-\2-/, '/$1/$2/')
      .replaceAll(/\/([^/]+)\/\1-/g, '/$1/')
      .replace(/\/(kubernetes)\/k8s-/, '/$1/');

  for (const [k, v] of [
    ['/kubernetes/k8s-1.2.3/', '/kubernetes/1.2.3/'],
    ['/kubernetes/kubernetes-1.2.3/', '/kubernetes/1.2.3/'],
    ['/web/web-faq/', '/web/faq/'],
    ['/web/dev/dev-faq', '/web/dev/faq'],
    ['/web/dev/web-dev-faq', '/web/dev/faq'],
  ]) {
    assert.equal(trim(k), v);
  }
});
