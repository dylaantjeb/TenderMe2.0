'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FileText,
  LayoutDashboard,
  FolderOpen,
  Settings,
  Users,
  BookOpen,
  Import,
  LogOut,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useThemeStore } from '@/hooks/use-tender-store';

const navigation = [
  { name: 'Dashboard', href: '/tenders', icon: LayoutDashboard },
  { name: 'Tenders', href: '/tenders', icon: FolderOpen },
  { name: 'Importeren', href: '/import', icon: Import },
  { name: 'Kennisbank', href: '/knowledge', icon: BookOpen },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Instellingen', href: '/settings', icon: Settings },
];

function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === 'dark' ? 'Lichte modus' : 'Donkere modus'}
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/tenders" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TenderMe</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/5 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>GDPR Compliant</span>
        </div>
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
