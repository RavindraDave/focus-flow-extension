/// <reference types="vitest" />

import type { AxeResults, ImpactValue, Result, RunOptions, Spec } from 'axe-core';

declare module 'jest-axe' {
  export interface JestAxeConfigureOptions extends RunOptions {
    globalOptions?: Spec | undefined;
    impactLevels?: ImpactValue[];
  }

  /**
   * Runs aXe on HTML.
   */
  export type JestAxe = (
    html: Element | string,
    options?: RunOptions
  ) => Promise<AxeResults>;

  /**
   * Version of the aXe verifier with defaults set.
   */
  export const axe: JestAxe;

  /**
   * Creates a new aXe verifier function.
   */
  export function configureAxe(options?: JestAxeConfigureOptions): JestAxe;

  /**
   * Results from asserting whether aXe verification passed.
   */
  export interface AssertionsResult {
    actual: Result[];
    message(): string;
    pass: boolean;
  }

  /**
   * Asserts an aXe-verified result has no violations.
   */
  export type IToHaveNoViolations = (
    results?: Partial<AxeResults>
  ) => AssertionsResult;

  export const toHaveNoViolations: {
    toHaveNoViolations: IToHaveNoViolations;
  };
}

declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toHaveNoViolations(): void;
    }
    interface AsymmetricMatchersContaining {
      toHaveNoViolations(): void;
    }
  }
}
