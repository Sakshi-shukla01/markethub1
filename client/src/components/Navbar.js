'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Heart, LayoutDashboard, ShoppingBag, LogOut, User, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import Avatar from './Avatar';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSearch = (e) => {
    e.preventDefault();
    router.push(`/marketplace?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 glass-strong dark:border-slate-800">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-black text-white">M</span>
          <span className="hidden text-xl font-extrabold gradient-text sm:block">MarketHub</span>
        </Link>

        <form onSubmit={onSearch} className="relative mx-2 hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for cars, phones, furniture..."
            className="input pl-10"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {!isAdmin && (
            <Link href="/sell" className="btn-primary hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> Sell
            </Link>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="overflow-hidden rounded-full border border-slate-300 dark:border-slate-700"
              >
                <Avatar src={user?.avatar} name={user?.name} size={40} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl glass-strong p-2"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <div className="px-3 py-2">
                      <p className="truncate font-semibold">{user?.name}</p>
                      <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMenuOpen(false)} />
                    {isAdmin ? (
                      <MenuLink href="/admin" icon={Shield} label="Admin Panel" onClick={() => setMenuOpen(false)} />
                    ) : (
                      <>
                        <MenuLink href="/my-ads" icon={User} label="My Ads" onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/wishlist" icon={Heart} label="Wishlist" onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/orders" icon={ShoppingBag} label="Orders" onClick={() => setMenuOpen(false)} />
                      </>
                    )}
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">Login</Link>
              <Link href="/register" className="btn-primary hidden sm:inline-flex">Sign up</Link>
            </>
          )}

          <button className="btn-ghost md:hidden" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* mobile search + actions */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800"
          >
            <form onSubmit={onSearch} className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="input pl-10" />
            </form>
            <div className="flex gap-2">
              {!isAdmin && (
                <Link href="/sell" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>Sell</Link>
              )}
              {!isAuthenticated && (
                <Link href="/login" className="btn-outline flex-1" onClick={() => setMobileOpen(false)}>Login</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuLink({ href, icon: Icon, label, onClick }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-200/60 dark:hover:bg-slate-800/60">
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}