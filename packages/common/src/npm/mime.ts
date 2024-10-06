import path from 'node:path';
import mime from 'mime';

mime.define(
  {
    'text/plain': [
      'authors',
      'changes',
      'license',
      'makefile',
      'patents',
      'readme',
      'ts',
      'tsx',
      'flow',
      //
    ],
  },
  /* force */ true,
);
// .npmrc, .gitkeep, .dockerignore, yarn.lock
const textFiles = /\/?(\.[a-z]*rc|\.git[a-z]*|\.[a-z]*ignore|\.lock)$/i;

export function getContentType(file: string) {
  const name = path.basename(file);
  return textFiles.test(name) ? 'text/plain' : mime.getType(name) || 'text/plain';
}
