'use client';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl glass py-16 text-center">
      <PackageOpen className="mb-4 h-12 w-12 text-slate-400" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
