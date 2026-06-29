'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Shell from '@/components/Shell';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminTabs from '@/components/AdminTabs';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import { timeAgo, errMsg } from '@/lib/format';

function UsersInner() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users')).data.data,
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Users</h1>
      <p className="mb-6 text-sm text-slate-500">{users?.length || 0} registered users.</p>

      <div className="overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/50 text-xs uppercase text-slate-400 dark:border-slate-700/50">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u._id} className="border-b border-slate-100/50 last:border-0 dark:border-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size={36} />
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{timeAgo(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => { if (confirm(`Delete ${u.name}?`)) del.mutate(u._id); }}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute adminOnly>
      <Shell>
        <AdminTabs />
        <UsersInner />
      </Shell>
    </ProtectedRoute>
  );
}
