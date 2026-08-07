import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { productsAPI } from '../services/api';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';

const emptyForm = {
  name: '',
  sku: '',
  barcode: '',
  cost_price: '',
  selling_price: '',
  quantity: '',
  low_stock_threshold: 5,
  unit: 'pcs',
  description: '',
};

export default function Inventory() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    productsAPI
      .list({ search: search || undefined })
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku || '',
      barcode: p.barcode || '',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      quantity: p.quantity,
      low_stock_threshold: p.low_stock_threshold,
      unit: p.unit || 'pcs',
      description: p.description || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      cost_price: parseFloat(form.cost_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      quantity: parseInt(form.quantity, 10) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
      sku: form.sku || null,
      barcode: form.barcode || null,
    };
    try {
      if (editing) {
        await productsAPI.update(editing.id, payload);
      } else {
        await productsAPI.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    try {
      await productsAPI.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || t('common.error'));
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('sw-TZ', { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {t('inventory.add_product')}
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-10"
          placeholder={t('inventory.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-gray-500 py-8 text-center">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">{t('dashboard.no_data')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">{t('inventory.name')}</th>
                <th className="pb-3 font-medium">{t('inventory.sku')}</th>
                <th className="pb-3 font-medium text-right">{t('inventory.cost_price')}</th>
                <th className="pb-3 font-medium text-right">{t('inventory.selling_price')}</th>
                <th className="pb-3 font-medium text-center">{t('inventory.stock')}</th>
                <th className="pb-3 font-medium text-right">{t('inventory.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.quantity <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="py-3 text-gray-500 font-mono text-xs">{p.sku || '—'}</td>
                    <td className="py-3 text-right">{fmt(p.cost_price)}</td>
                    <td className="py-3 text-right font-semibold">{fmt(p.selling_price)}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          low ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.quantity} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg ml-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {editing ? t('inventory.edit_product') : t('inventory.add_product')}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t('inventory.name')} *</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('inventory.sku')}</label>
                  <input
                    className="input-field"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('inventory.barcode')}</label>
                  <input
                    className="input-field"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('inventory.cost_price')} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('inventory.selling_price')} *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('inventory.quantity')} *</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('inventory.unit')}</label>
                  <input
                    className="input-field"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('inventory.low_threshold')}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
