'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Today' },
  { href: '/map', label: 'Map' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/journal', label: 'Journal' },
];

export default function Nav() {
  // Export uses trailing slashes, so normalise before comparing.
  const pathname = usePathname().replace(/\/+$/, '') || '/';
  return (
    <nav>
      {LINKS.map((l) => {
        const active =
          l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? 'active' : ''}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
