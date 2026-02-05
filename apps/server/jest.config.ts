import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  modulePathIgnorePatterns: ['dist'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          types: ['node', 'jest'],
          esModuleInterop: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          moduleResolution: 'node',
        },
      },
    ],
  },
};

export default config;
