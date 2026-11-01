import SiteShell from './components/SiteShell';

export default function NotFound() {
  return <SiteShell active=""><section className="page-intro"><h1>This page isn’t here.</h1><p className="lede">Return to the workspace to find your project, or start with the working example.</p><div className="cta-row"><a className="cta" href="/workspace">Open workspace</a><a className="cta ghost" href="/demo">Explore the example</a></div></section></SiteShell>;
}
