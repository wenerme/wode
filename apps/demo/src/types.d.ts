declare module 'embed:*' {
  const fs: typeof import('node:fs/promises');
  export { fs };
}
