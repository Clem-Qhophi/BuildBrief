import type { ReactNode } from 'react';
import Brand from './Brand';
import '../landing.css';

export default function SiteShell({ active, children }: { active: string; children: ReactNode }) {
  return <div className="public-site">
    <header className="site-nav"><Brand />
      <nav aria-label="Product">{[['/start', 'Start with an idea'], ['/features', 'Features'], ['/how-it-works', 'How it works'], ['/demo', 'Example']].map(([href, label]) =>
        <a key={href} href={href} aria-current={active === href ? 'page' : undefined}>{label}</a>)}</nav>
      <a className="button secondary" href="/workspace">Open workspace</a>
    </header>
    <main id="main" className="site">{children}</main>
    <footer className="site-foot"><Brand /><p>From intent to proof, and from proof to understanding.</p>
      <nav aria-label="Footer"><a href="/connect">Connect a project</a><a href="/how-it-works#privacy">Privacy</a><a href="/workspace">Workspace</a></nav>
    </footer>
  </div>;
}
