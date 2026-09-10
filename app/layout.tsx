import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Store from '@/components/Store';
import { buildAppData } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Cooking Curriculum',
  description: 'A structured path to cooking without recipes.',
  appleWebApp: { capable: true, title: 'Cooking', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f5' },
    { media: '(prefers-color-scheme: dark)', color: '#171614' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read at build time and handed to the client store, which is where all
  // progress reasoning happens once the page is static.
  const data = buildAppData();

  return (
    <html lang="en">
      <body>
        <Store data={data}>
          <header className="top">
            <div className="inner">
              <Link href="/" className="brand">
                Cooking Curriculum
              </Link>
              <Nav />
            </div>
          </header>
          <div className="shell">{children}</div>
        </Store>
      </body>
    </html>
  );
}
