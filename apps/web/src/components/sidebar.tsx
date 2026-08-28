'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Bot, Megaphone } from 'lucide-react';

const navItems = [
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/agents', icon: Bot, label: 'Agents' },
  { href: '/campaigns', icon: Megaphone, label: 'Campaigns' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-7 h-7 rounded-full bg-violet-600 shrink-0" />
        <span className="text-white font-semibold text-lg">GetCloser</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 mt-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
