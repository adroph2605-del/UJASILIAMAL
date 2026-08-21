import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { branchesAPI } from '../services/api';
import { useBranch } from '../contexts/BranchContext';
import { Store, Plus, MapPin, Check } from 'lucide-react';

export default function Branches() {
  const { t } = useTranslation();
  const { refresh, setBranchId, branchId } = useBranch();
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    branchesAPI
      .list()
      .then((res) => setList(res.data || []))
      .catch((e) => setError(e.response?.data?.detail || t('common.error')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await branchesAPI.create({
        name: name.trim(),
        phone: phone || null,
        address: address || null,
      });
      setName('');
      setPhone('');
      setAddress('');
      load();
      await refresh();
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const useThis = (id) => {
    setBranchId(id);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Store className="text-teal-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('branches.title')}
          </h1>
          <p className="text-sm text-gray-500">{t('branches.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="card space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Plus size={18} />
          {t('branches.add')}
        </h2>
        <input
          className="input-field"
          placeholder={t('branches.name_placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input-field"
          placeholder={t('branches.phone_optional')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="input-field"
          placeholder={t('branches.address_optional')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{String(error)}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? t('common.loading') : t('branches.save')}
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-4">{t('branches.list')}</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">{t('common.loading')}</p>
        ) : list.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('branches.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {list.map((b) => {
              const active = branchId === b.id;
              return (
                <li
                  key={b.id}
                  className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border ${
                    active
                      ? 'bg-teal-50 border-teal-300 dark:bg-teal-900/30 dark:border-teal-700'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {b.name}
                      {active && (
                        <span className="text-xs text-teal-700 dark:text-teal-300 flex items-center gap-0.5">
                          <Check size={14} /> {t('branches.active')}
                        </span>
                      )}
                    </p>
                    {(b.address || b.phone) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} />
                        {[b.phone, b.address].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => useThis(b.id)}
                    className={`text-sm px-3 py-1.5 rounded-lg ${
                      active
                        ? 'bg-teal-700 text-white'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    {t('branches.use_this')}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-gray-400 mt-4">{t('branches.hint')}</p>
      </div>
    </div>
  );
}
