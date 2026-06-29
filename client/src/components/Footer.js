'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Footer() {
  const { isAdmin } = useAuth();
  return (
    <footer className="mt-16 border-t border-slate-200 py-10 dark:border-slate-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 font-black text-white">M</span>
            <span className="text-lg font-extrabold gradient-text">MarketHub</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Buy and sell anything near you. A modern marketplace built for speed.
          </p>
        </div>
        {isAdmin ? (
          <>
            <FooterCol title="Marketplace" links={[['Browse', '/marketplace']]} />
            <FooterCol title="Admin" links={[['Dashboard', '/dashboard'], ['Moderation', '/admin'], ['Orders', '/admin/orders']]} />
          </>
        ) : (
          <>
            <FooterCol title="Marketplace" links={[['Browse', '/marketplace'], ['Sell', '/sell'], ['Wishlist', '/wishlist']]} />
            <FooterCol title="Account" links={[['Dashboard', '/dashboard'], ['My Ads', '/my-ads'], ['Orders', '/orders']]} />
          </>
        )}
        <FooterCol title="Company" links={[['About', '/'], ['Privacy', '/'], ['Terms', '/']]} />
      </div>
      <p className="mt-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} MarketHub. Built as a portfolio project.
      </p>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-slate-500">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-brand-600">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}