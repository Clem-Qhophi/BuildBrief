import { openProjectStore, rebuildViews, type ProjectStore } from '@buildbrief/store';

/** Store handle plus freshly materialized views for one project. */
export function getViewsForWrite(root: string, project: string): ReturnType<typeof rebuildViews> & { store: ProjectStore } {
  const store = openProjectStore(root, project);
  const views = rebuildViews(store, project);
  return { ...views, store };
}
