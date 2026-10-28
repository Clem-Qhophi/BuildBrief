import {
  type AtomicCriterion,
  type Finding,
  type IntentConstraint,
} from '@buildbrief/domain';
import { type TestRun } from '@buildbrief/repo';

/** Fault class under test. */
export type CaseClass =
  | 'happy'
  | 'false_green'
  | 'partial'
  | 'contradiction'
  | 'absent_exhaustive'
  | 'orphan_benign'
  | 'deleted_test'
  | 'adversarial_readme'
  | 'runtime_unknown'
  | 'mixed';

export interface EvalCase {
  id: string;
  caseClass: CaseClass;
  holdout: boolean;
  prompt: string;
  criteria: AtomicCriterion[];
  constraints: IntentConstraint[];
  /** Files at base commit. */
  base: Record<string, string>;
  /** Files at head commit (feature work). Defaults to base. */
  head?: Record<string, string>;
  /** Expected finding per criterion id. */
  expected: Record<string, Finding>;
  /** Expected evidence grade per criterion id (subset is fine). */
  expectedGrades?: Record<string, 'E0_claim' | 'E1_source' | 'E2_test' | 'E3_runtime' | 'E4_production'>;
  /** Orphan paths that MUST be flagged (empty = none expected). */
  expectedOrphans: string[];
  /** Exact risk asserted per flagged orphan path (subset is fine). */
  expectedRisk?: Record<string, 'low' | 'medium' | 'high' | 'critical'>;
  /** Max allowed risk among flagged orphans NOT in expectedOrphans (false-alarm guard). */
  maxUnexpectedRisk?: 'low' | 'medium' | 'high' | 'critical';
  /** Covering test runs attached at head revision (ids assigned by runner). */
  testRuns?: { command: string[]; covers: string[]; exitCode: number }[];
  /** Forbidden strings that must appear NOWHERE in findings/packs (injection probe). */
  forbiddenInOutput?: string[];
  /**
   * Known-gap probe: documents a suspected engine weakness (false confidence or
   * miss). Runs and reports, but never fails the gate — the gap is the finding.
   */
  known_gap?: boolean;
  /** Optional second revision: re-verify after these files replace head. */
  second?: {
    head: Record<string, string>;
    expected: Record<string, Finding>;
  };
}

export interface CaseResult {
  caseId: string;
  caseClass: CaseClass;
  holdout: boolean;
  known_gap: boolean;
  pass: boolean;
  failures: string[];
  findings: Record<string, Finding>;
  secondFindings?: Record<string, Finding>;
  orphans: { path: string; risk: string; flags: string[] }[];
  latencyMs: number;
  revision: string;
}

export type { TestRun };
