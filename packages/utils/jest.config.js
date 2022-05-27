// const { pathsToModuleNameMapper } = require('ts-jest/utils');
// const { compilerOptions } = require('./tsconfig');

module.exports = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.jest.json',
      // tsConfig: 'tsconfig.json',
    },
  },
  // roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  testMatch: ['<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)'],
  // moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
};
