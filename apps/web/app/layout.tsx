import type { ReactNode } from 'react';
import './globals.css';

export const metadata = { title: 'Build Brief workbench', description: 'Intent ledger and verification findings, read from the real ledger.' };

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <header className="top">
            <p className="brand">Build Brief workbench — every claim below resolves to a ledger event or report pointer</p>
            <nav>
              <a href="/">Intents</a>
              <a href="/runs">Runs</a>
              <a href="/changes">Changes</a>
              <a href="/map">Map</a>
              <a href="/new">New</a>
              <a href="/connect">Connect</a>
              <a href="/settings">Settings</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
