export const isDev = () => {
  return typeof process !== 'undefined' && (process?.env?.NODE_ENV || '').startsWith('dev');
};
