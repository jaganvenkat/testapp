/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
}

module.exports = config
