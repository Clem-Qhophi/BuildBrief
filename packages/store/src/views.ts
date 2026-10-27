import {
  type CandidateUnrequestedChange,
  type CorrectionPack,
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
      default:
        break;
    }
  }
  writeView(s, 'views', views);
  return views;
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
  });
}
