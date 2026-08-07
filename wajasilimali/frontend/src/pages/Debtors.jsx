import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { debtorsAPI } from '../services/api';
import { CreditCard, X } from 'lucide-react';

export default function Debtors() {
  const { t } = useTranslation();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettled, setShowSettled] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    debtorsAPI
      .list({ settled: showSettled })
      .then((res) => setDebts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [showSettled]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await debtorsAPI.recordPayment(paymentModal.id, {
        amount: parseFloat(amount),
        payment_method: method,
      });
      setPaymentModal(null);
      setAmount('');
      load();
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('debtors.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettled(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !showSettled ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('debtors.unsettled')}
          </button>
          <button
            onClick={() => setShowSettled(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              showSettled ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('debtors.settled')}
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
        ) : debts.length === 0 ? (
          <p className="text-center text-gray-400 py-8">{t('debtors.no_debts')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">{t('debtors.customer')}</th>
                <th className="pb-3 font-medium text-right">{t('debtors.original')}</th>
                <th className="pb-3 font-medium text-right">{t('debtors.remaining')}</th>
                <th className="pb-3 font-medium">{t('debtors.due_date')}</th>
                <th className="pb-3 font-medium">{t('common.date')}</th>
                <th className="pb-3 font-medium text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3">
                    <p className="font-medium text-gray-800">{d.customer?.name || '—'}</p>
                    {d.customer?.phone && (
                      <p className="text-xs text-gray-400">{d.customer.phone}</p>
                    )}
                  </td>
                  <td className="py-3 text-right">{fmt(d.original_amount)}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`font-semibold ${
                        d.remaining_amount > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {fmt(d.remaining_amount)}
                    </span>
                  </td>
                  <td className="py-3">
                    {d.due_date ? new Date(d.due_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    {!d.is_settled && (
                      <button
                        onClick={() => {
                          setPaymentModal(d);
                          setAmount('');
                          setError('');
                        }}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        {t('debtors.record_payment')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard size={20} />
                {t('debtors.record_payment')}
              </h2>
              <button onClick={() => setPaymentModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePayment} className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                {paymentModal.customer?.name} — {t('debtors.remaining')}:{' '}
                <strong>{fmt(paymentModal.remaining_amount)}</strong>
              </p>
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1">{t('debtors.amount')} *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={paymentModal.remaining_amount}
                  className="input-field"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('pos.payment_method')}</label>
                <select
                  className="input-field"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="cash">{t('pos.cash')}</option>
                  <option value="mobile_money">{t('pos.mobile_money')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPaymentModal(null)} className="btn-secondary flex-1">
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
