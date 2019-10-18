/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Location, Uri } from 'vscode';

export enum TestType {
  LWC = 'lwc'
}

export enum TestResultStatus {
  PASSED,
  FAILED,
  SKIPPED
}

export interface TestResult {
  status: TestResultStatus;
}

export enum TestInfoKind {
  TEST_CASE = 'testCase',
  TEST_FILE = 'testFile'
}

export interface TestFileInfo {
  kind: TestInfoKind.TEST_FILE;
  testType: TestType;
  testUri: Uri;
  testLocation?: Location;
  testResult?: TestResult;
}

export interface TestCaseInfo {
  kind: TestInfoKind.TEST_CASE;
  testType: TestType;
  testUri: Uri;
  testLocation?: Location;
  testResult?: TestResult;
  testName: string;
}

// export type TestCaseInfo = TestFileInfo & {
//   kind: TestInfoKind.TEST_CASE;
//   testName: string;
// };

export type TestExecutionInfo = TestCaseInfo | TestFileInfo;

// Jest Specific definitions
export interface LwcJestTestResults {
  numFailedTestSuites: number;
  numFailedTests: number;
  numPassedTestSuites: number;
  numPassedTests: number;
  numPendingTestSuites: number;
  numPendingTests: number;
  numRuntimeErrorTestSuites: number;
  numTotalTestSuites: number;
  numTotalTests: number;
  testResults: LwcJestTestFileResult[];
}

type LwcJestTestResultStatus =
  | 'passed'
  | 'failed'
  | 'pending'
  | 'skipped'
  | 'pending'
  | 'todo'
  | 'disabled';

export interface LwcJestTestFileResult {
  status: LwcJestTestResultStatus;
  startTime: number;
  endTime: number;
  name: string;
  assertionResults: LwcJestTestAssertionResult[];
}

export interface LwcJestTestAssertionResult {
  status: LwcJestTestResultStatus;
  title: string;
  ancestorTitles: string[];
  failureMessages: string[];
  fullName: string;
  location: {
    column: number;
    line: number;
  };
}
