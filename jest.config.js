/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  // Next.js のテンプレート/ルート系は対象外。__tests__ 配下のみ実行する。
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // tsconfig.json は Next.js 向けに module=esnext にしているため、
        // jest では CommonJS で走らせる必要があり上書きする。
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react',
          target: 'es2020',
          esModuleInterop: true,
          isolatedModules: false,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
