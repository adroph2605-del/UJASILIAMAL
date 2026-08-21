import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Users, Shield, Store } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stores');
  const [error, setError] = useState('');

  // Hooks FIRST — then check superuser
  const isSuper = !!(user && user.is_superuser);

  useEffect(() => {
    if (authLoading || !isSuper) return;

    setLoading(true);
    setError('');
    Promise.all([
      authAPI.listUsers().catch((e) => {
        console.error(e);
        return { data: [] };
      }),
      authAPI.listBusinesses().catch((e) => {
        console.error(e);
        return { data: [] };
      }),
    ])
      .then(([u, b]) => {
        setUsers(u.data || []);
        setBusinesses(b.data || []);
      })
      .catch((e) => setError(String(e.message || e)))
      .finally(() => setLoading(false));
  }, [authLoading, isSuper]);

  const handleToggle = async (id) => {
    try {
      await authAPI.toggleUser(id);
      const res = await authAPI.listUsers();
      setUsers(res.data || []);
    } catch (err) {
      alert(err.response?.data?.detail || 'Hitilafu');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Inapakia...</p>
      </div>
    );
  }

  // Sio super admin → rudi home (hakuna Admin)
  if (!user || !user.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield size={24} className="text-primary-600" />
          Super Administrator
          <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full">
            Wewe peke yako
          </span>
        </h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('stores')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'stores'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          <Store size={16} className="inline mr-1" /> Maduka yote
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'users'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          <Users size={16} className="inline mr-1" /> Watumiaji wote
        </button>
      </div>

      {tab === 'stores' && (
        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-4 dark:text-gray-100">Maduka kwenye database</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-6">Inapakia...</p>
          ) : businesses.length === 0 ? (
            <p className="text-center text-gray-400 py-6">Hakuna maduka bado</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Jina la Biashara</th>
                  <th className="pb-2">Simu</th>
                  <th className="pb-2">Tarehe</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 dark:border-gray-700">
                    <td className="py-2.5 dark:text-gray-200">{b.id}</td>
                    <td className="py-2.5 font-medium dark:text-gray-100">{b.name}</td>
                    <td className="py-2.5 dark:text-gray-300">{b.phone || '—'}</td>
                    <td className="py-2.5 text-gray-500">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-4 dark:text-gray-100">Watumiaji wote</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Inapakia...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Hakuna watumiaji</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-3">Jina</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Biashara ID</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Hali</th>
                  <th className="pb-3 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700">
                    <td className="py-3 font-medium dark:text-gray-100">{u.full_name}</td>
                    <td className="py-3 dark:text-gray-300">{u.email}</td>
                    <td className="py-3 dark:text-gray-300">{u.business_id ?? '—'}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.is_superuser
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.is_superuser ? 'super' : u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {u.id !== user?.id && !u.is_superuser && (
                        <button
                          type="button"
                          onClick={() => handleToggle(u.id)}
                          className={`text-xs py-1.5 px-3 rounded-lg font-medium ${
                            u.is_active
                              ? 'bg-red-50 text-red-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {u.is_active ? 'Zima' : 'Washa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
