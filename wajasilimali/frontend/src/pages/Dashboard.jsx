import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../services/api';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  DollarSign,
} from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .stats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-gray-500 mt-10">{t('common.error')}</p>;
  }

  const fmt = (n) =>
    new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.today_sales')}
          value={fmt(stats.today_sales)}
          icon={TrendingUp}
          color="bg-emerald-500"
          subtitle={`${stats.today_transactions} ${t('dashboard.transactions')}`}
        />
        <StatCard
          title={t('dashboard.net_profit')}
          value={fmt(stats.net_profit_today)}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <StatCard
          title={t('dashboard.total_products')}
          value={stats.total_products}
          icon={Package}
          color="bg-indigo-500"
        />
        <StatCard
          title={t('dashboard.low_stock')}
          value={stats.low_stock_count}
          icon={AlertTriangle}
          color="bg-amber-500"
        />
        <StatCard
          title={t('dashboard.total_debts')}
          value={fmt(stats.total_debts)}
          icon={CreditCard}
          color="bg-rose-500"
          subtitle={`${stats.unpaid_debts_count} ${t('dashboard.unpaid_debts')}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            {t('dashboard.low_stock_alert')}
          </h2>
          {stats.low_stock_products.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('dashboard.no_data')}</p>
          ) : (
            <ul className="space-y-2">
              {stats.low_stock_products.map((p) => (
                <li key={p.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="text-sm text-amber-600 font-semibold">
                    {p.quantity} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top products */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary-600" />
            {t('dashboard.top_products')}
          </h2>
          {stats.top_products.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('dashboard.no_data')}</p>
          ) : (
            <ul className="space-y-2">
              {stats.top_products.map((p, i) => (
                <li key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-700">
                    {i + 1}. {p.name}
                  </span>
                  <div className="text-right text-sm">
                    <span className="text-gray-600">{p.qty_sold} sold</span>
                    <span className="block text-emerald-600 font-medium">{fmt(p.revenue)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent sales */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{t('dashboard.recent_sales')}</h2>
        {stats.recent_sales.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('dashboard.no_data')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Receipt</th>
                  <th className="pb-2 font-medium">{t('common.date')}</th>
                  <th className="pb-2 font-medium">{t('pos.payment_method')}</th>
                  <th className="pb-2 font-medium text-right">{t('pos.total')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_sales.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 font-mono text-xs">{s.receipt_number}</td>
                    <td className="py-2.5">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="py-2.5 capitalize">{s.payment_method.replace('_', ' ')}</td>
                    <td className="py-2.5 text-right font-semibold">{fmt(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
