const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest/presets/default",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: ["<rootDir>/src/**", "!**/types/**"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: "<rootDir>/",
    }),
  },
  setupFilesAfterEnv: [],
  setupFiles: [],
  globals: {},
  testTimeout: 20000,
  // transform: {
  //   "^.+\\.tsx?$": [
  //     "ts-jest",
  //     { tsconfig: "<rootDir>/core/test-utilities/tsconfig.json" },
  //   ],
  // },
  reporters: [
    "default",
    [
      "jest-junit",
      { outputDirectory: "test-results", outputName: "report.xml" },
    ],
  ],
};
