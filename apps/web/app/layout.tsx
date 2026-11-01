import type { ReactNode } from 'react';
import './globals.css';
export const metadata = { title: 'Build Brief', description: 'Know what your AI built. Connect your request to code, tests, and evidence you can inspect.' };
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>{children}</body></html>;
}
