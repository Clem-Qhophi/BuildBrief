import {
  type AcceptanceCheck,
  type AgentEvent,
  type AgentSession,
  type CandidateUnrequestedChange,
  type ClarificationQuestion,
  type CorrectionPack,
  type DecisionRecord,
  type GateRecord,
  type IntentVersion,
  type VerificationFinding,
} from '@buildbrief/domain';
import { readEvents, readView, writeView, type ProjectStore } from './ledger.js';

export interface ProjectViews {
  intents: Record<string, IntentVersion>;
  approvedByFeature: Record<string, string>;
  findings: Record<string, VerificationFinding>;
  findingsByRun: Record<string, string[]>;
  orphans: Record<string, CandidateUnrequestedChange>;
  packs: Record<string, CorrectionPack>;
  snapshots: Record<string, { revision: string; at: string; files: number }>;
  questions: Record<string, ClarificationQuestion>;
  decisions: Record<string, DecisionRecord>;
  checks: Record<string, AcceptanceCheck>;
  sessions: Record<string, AgentSession>;
  sessionEvents: Record<string, AgentEvent[]>;
  gates: Record<string, GateRecord>;
}

/** Rebuilds all views from the append-only log. Deterministic: same events → same views. */
export function rebuildViews(s: ProjectStore, projectId: string): ProjectViews {
  const events = readEvents(s, projectId);
  const views: ProjectViews = {
    intents: {},
    approvedByFeature: {},
    findings: {},
    findingsByRun: {},
    orphans: {},
    packs: {},
    snapshots: {},
    questions: {},
    decisions: {},
    checks: {},
    sessions: {},
    sessionEvents: {},
    gates: {},
  };
  for (const e of events) {
    const p = e.payload;
    switch (e.type) {
      case 'intent.approved':
      case 'intent.extracted': {
        const intent = p['intent'] as IntentVersion;
        views.intents[intent.id] = intent;
        if (intent.state === 'approved') views.approvedByFeature[intent.feature_id] = intent.id;
        break;
      }
      case 'intent.superseded': {
        const retired = p['retired'] as IntentVersion;
        const draft = p['draft'] as IntentVersion | undefined;
        views.intents[retired.id] = retired;
        if (draft !== undefined) views.intents[draft.id] = draft;
        break;
      }
      case 'repo.snapshot.created': {
        const revision = p['revision'] as string;
        views.snapshots[revision] = { revision, at: e.at, files: p['files'] as number };
        break;
      }
      case 'finding.recorded': {
        const f = p['finding'] as VerificationFinding;
        views.findings[f.id] = f;
        const list = views.findingsByRun[f.run_id] ?? [];
        list.push(f.id);
        views.findingsByRun[f.run_id] = list;
        break;
      }
      case 'change.orphan_flagged': {
        const o = p['orphan'] as CandidateUnrequestedChange;
        views.orphans[o.id] = o;
        break;
      }
      case 'change.dispositioned': {
        const id = p['orphan_id'] as string;
        const existing = views.orphans[id];
        const disposition = p['disposition'] as CandidateUnrequestedChange['disposition'];
        if (existing !== undefined && disposition !== undefined) {
          views.orphans[id] = { ...existing, disposition };
        }
        break;
      }
      case 'evidence.invalidated': {
        const ids = (p['finding_ids'] as string[]) ?? [];
        for (const id of ids) {
          const existing = views.findings[id];
          if (existing !== undefined) views.findings[id] = { ...existing, stale: true };
        }
        break;
      }
      case 'correction.pack_created': {
        const pack = p['pack'] as CorrectionPack;
        views.packs[pack.id] = pack;
        break;
      }
      case 'question.asked': {
        const question = p['question'] as ClarificationQuestion;
        views.questions[question.id] = question;
        break;
      }
      case 'decision.recorded': {
        const decision = p['decision'] as DecisionRecord;
        views.decisions[decision.question_id] = decision;
        const existing = views.questions[decision.question_id];
        if (existing !== undefined) views.questions[decision.question_id] = { ...existing, status: 'answered' };
        break;
      }
      case 'check.recorded':
      case 'check.completed': {
        const check = p['check'] as AcceptanceCheck;
        views.checks[check.id] = check;
        break;
      }
      case 'agent.session_started': {
        const session = p['session'] as AgentSession;
        views.sessions[session.id] = session;
        break;
      }
      case 'agent.event_recorded': {
        const event = p['event'] as AgentEvent;
        const list = views.sessionEvents[event.session_id] ?? [];
        list.push(event);
        views.sessionEvents[event.session_id] = list;
        break;
      }
      case 'gate.decided': {
        const gate = p['gate'] as GateRecord;
        views.gates[gate.session_id] = gate;
        break;
      }
      default:
        break;
    }
  }
  // No events = no ledger here: skip the write so pure reads in an empty
  // directory leave no `.buildbrief/` behind.
  if (events.length > 0) writeView(s, 'views', views);
  return views;
}

/**
 * Revision of the most recently recorded finding. Orders by `created_at`,
 * never by lexicographic SHA — Git hashes carry no time order and string-max
 * silently picks a stale revision whenever the older hash sorts last.
 */
export function latestRevision(findings: VerificationFinding[]): string {
  let best: VerificationFinding | undefined;
  for (const f of findings) {
    if (best === undefined || f.created_at > best.created_at) best = f;
  }
  return best?.checked_revision ?? '';
}

export function loadViews(s: ProjectStore): ProjectViews {
  return readView<ProjectViews>(s, 'views', {
    intents: {},
    approvedByFeature: {},
    findings: {},
    findingsByRun: {},
    orphans: {},
    packs: {},
    snapshots: {},
    questions: {},
    decisions: {},
    checks: {},
    sessions: {},
    sessionEvents: {},
    gates: {},
  });
}
