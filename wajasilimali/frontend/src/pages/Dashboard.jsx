import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../services/api';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  DollarSign,
  X,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function fmtNum(n) {
  return new Intl.NumberFormat('sw-TZ', { maximumFractionDigits: 0 }).format(n || 0);
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={
          'bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-800 ' +
          (wide ? 'max-w-3xl' : 'max-w-2xl')
        }
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/** Kadi ya kisasa — glass / gradient */
function BentoCard({ title, value, subtitle, icon: Icon, gradient, onClick, span }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300 ' +
        'hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] ' +
        (span || '') +
        ' ' +
        gradient
      }
    >
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-white/70 mt-2 flex items-center gap-1">
              {subtitle}
              {onClick && <ArrowUpRight size={12} className="opacity-70" />}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-sm shrink-0">
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

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
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-gray-500 mt-10">{t('common.error')}</p>;
  }

  const todayList = stats.today_sales_list || [];
  const lowList = stats.low_stock_products || [];
  const debtsList = stats.open_debts || [];
  const profitDays = (stats.profit_by_day || []).slice().reverse(); // newest first

  const hour = new Date().getHours();
  const greet =
    hour < 12
      ? t('dashboard.greeting_morning')
      : hour < 17
      ? t('dashboard.greeting_afternoon')
      : t('dashboard.greeting_evening');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full mb-2">
            <Sparkles size={12} />
            {t('dashboard.badge')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {greet}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('dashboard.summary_for')} · {new Date().toLocaleDateString('sw-TZ', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Bento grid — kisasa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <BentoCard
          title={t('dashboard.today_sales')}
          value={fmt(stats.today_sales)}
          subtitle={`${stats.today_transactions || 0} ${t('dashboard.today_sales_sub')}`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => setModal('today')}
          span="sm:col-span-1"
        />
        <BentoCard
          title={t('dashboard.net_profit')}
          value={fmt(stats.net_profit_today)}
          subtitle={t('dashboard.net_profit_sub')}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
          onClick={() => setModal('profit')}
        />
        <BentoCard
          title={t('dashboard.total_products')}
          value={fmtNum(stats.total_products)}
          subtitle={t('dashboard.total_products_sub')}
          icon={Package}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          onClick={() => navigate('/inventory')}
        />
        <BentoCard
          title={t('dashboard.low_stock')}
          value={fmtNum(stats.low_stock_count)}
          subtitle={t('dashboard.low_stock_sub')}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          onClick={() => setModal('low')}
        />
        <BentoCard
          title={t('dashboard.total_debts')}
          value={fmt(stats.total_debts)}
          subtitle={`${stats.unpaid_debts_count || 0} ${t('dashboard.total_debts_sub')}`}
          icon={CreditCard}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          onClick={() => setModal('debts')}
          span="sm:col-span-2 xl:col-span-2"
        />
        <BentoCard
          title={t('dashboard.top_sales_card')}
          value={
            stats.top_products?.[0]?.name
              ? stats.top_products[0].name.slice(0, 18)
              : '—'
          }
          subtitle={t('dashboard.top_sales_sub')}
          icon={ShoppingBag}
          gradient="bg-gradient-to-br from-cyan-500 to-sky-700"
          onClick={() => setModal('top')}
          span="sm:col-span-2 xl:col-span-2"
        />
      </div>

      {/* Quick strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary-600" />
            {t('dashboard.top_products')}
          </h2>
          {(stats.top_products || []).length === 0 ? (
            <p className="text-gray-400 text-sm">{t('dashboard.no_data')}</p>
          ) : (
            <ul className="space-y-3">
              {stats.top_products.slice(0, 5).map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty_sold} units</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{fmt(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.recent_sales')}</h2>
          {(stats.recent_sales || []).length === 0 ? (
            <p className="text-gray-400 text-sm">{t('dashboard.no_data')}</p>
          ) : (
            <ul className="space-y-3">
              {stats.recent_sales.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-center gap-2 py-1 border-b border-gray-50 dark:border-gray-800 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-primary-600">{s.receipt_number}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleString('sw-TZ')}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmt(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* MODAL: Mauzo ya leo */}
      {modal === 'today' && (
        <Modal title={`${t('dashboard.modal_today_title')} (${todayList.length})`} onClose={() => setModal(null)} wide>
          {todayList.length === 0 ? (
            <p className="text-gray-400 text-center py-10">{t('dashboard.no_sales_today')}</p>
          ) : (
            <div className="space-y-4">
              {todayList.map((s) => {
                const isDebt = s.payment_method === 'debt';
                const paid = s.amount_paid ?? 0;
                const total = s.total ?? 0;
                const balance = Math.max(0, total - paid);
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2 bg-gray-50/80 dark:bg-gray-800/50"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-primary-600">
                        {s.receipt_number}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(s.created_at).toLocaleString('sw-TZ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-900 border capitalize">
                        {(s.payment_method || '').replace(/_/g, ' ')}
                      </span>
                      {s.customer?.name && (
                        <span className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-900 border">
                          {s.customer.name}
                        </span>
                      )}
                    </div>
                    <ul className="text-sm space-y-1 pt-1">
                      {(s.items || []).map((it) => (
                        <li key={it.id} className="flex justify-between">
                          <span>
                            {it.product?.name || 'Bidhaa'} × {it.quantity}
                          </span>
                          <span className="font-medium">{fmt(it.total)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700 space-y-1 text-sm">
                      <div className="flex justify-between font-bold">
                        <span>Jumla</span>
                        <span>{fmt(total)}</span>
                      </div>
                      {isDebt ? (
                        <>
                          <div className="flex justify-between text-amber-700">
                            <span>{t('dashboard.borrowed')}</span>
                            <span>{t('dashboard.yes')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('dashboard.paid_advance')}</span>
                            <span>{fmt(paid)}</span>
                          </div>
                          <div className="flex justify-between text-rose-600 font-semibold">
                            <span>{t('dashboard.balance_due')}</span>
                            <span>{fmt(balance)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>{t('dashboard.status')}</span>
                          <span>{t('dashboard.paid_full')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-right font-bold text-emerald-600 text-lg">
                {t('dashboard.day_total')}: {fmt(stats.today_sales)}
              </p>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL: Faida kwa siku */}
      {modal === 'profit' && (
        <Modal title={t('dashboard.modal_profit_title')} onClose={() => setModal(null)} wide>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/30 p-4">
              <p className="text-xs text-blue-600">{t('dashboard.profit_today')}</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {fmt(stats.net_profit_today)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 p-4">
              <p className="text-xs text-emerald-600">{t('dashboard.profit_30')}</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {fmt(profitDays.reduce((s, d) => s + (d.profit || 0), 0))}
              </p>
            </div>
          </div>
          {profitDays.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Hakuna data</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-2">{t('dashboard.date')}</th>
                  <th className="pb-2 text-center">{t('dashboard.sales')}</th>
                  <th className="pb-2 text-right">{t('dashboard.profit')}</th>
                </tr>
              </thead>
              <tbody>
                {profitDays.map((d) => (
                  <tr key={d.date} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('sw-TZ', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      <span className="block text-xs text-gray-400">{d.transactions} mauzo</span>
                    </td>
                    <td className="py-2.5 text-center text-gray-600">{fmt(d.sales)}</td>
                    <td
                      className={
                        'py-2.5 text-right font-semibold ' +
                        ((d.profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600')
                      }
                    >
                      {fmt(d.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {/* MODAL: Stoki */}
      {modal === 'low' && (
        <Modal title={`${t('dashboard.modal_low_title')} (${lowList.length})`} onClose={() => setModal(null)}>
          {lowList.length === 0 ? (
            <p className="text-gray-400 text-center py-8">{t('dashboard.no_low_stock')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">{t('dashboard.product')}</th>
                  <th className="pb-2 text-right">{t('dashboard.qty_left')}</th>
                </tr>
              </thead>
              <tbody>
                {lowList.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 text-right text-amber-600 font-semibold">
                      {p.quantity} {p.unit || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            type="button"
            onClick={() => {
              setModal(null);
              navigate('/inventory');
            }}
            className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium text-sm"
          >
            {t('dashboard.go_inventory')}
          </button>
        </Modal>
      )}

      {/* MODAL: Madeni */}
      {modal === 'debts' && (
        <Modal title={t('dashboard.modal_debts_title')} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl bg-rose-50 p-4 text-center">
              <p className="text-xs text-rose-600">{t('dashboard.total')}</p>
              <p className="text-lg font-bold text-rose-700">{fmt(stats.total_debts)}</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4 text-center">
              <p className="text-xs text-orange-600">{t('dashboard.debtors_count')}</p>
              <p className="text-lg font-bold text-orange-700">{stats.unpaid_debts_count}</p>
            </div>
          </div>
          {debtsList.length === 0 ? (
            <p className="text-gray-400 text-center py-6">{t('dashboard.no_debts')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">{t('dashboard.customer')}</th>
                  <th className="pb-2 text-right">{t('dashboard.original')}</th>
                  <th className="pb-2 text-right">{t('dashboard.remaining')}</th>
                </tr>
              </thead>
              <tbody>
                {debtsList.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium">
                      {d.customer?.name || d.customer?.phone || 'Mteja'}
                    </td>
                    <td className="py-2.5 text-right text-gray-500">{fmt(d.original_amount)}</td>
                    <td className="py-2.5 text-right text-rose-600 font-semibold">
                      {fmt(d.remaining_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            type="button"
            onClick={() => {
              setModal(null);
              navigate('/debtors');
            }}
            className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium text-sm"
          >
            {t('dashboard.go_debtors')}
          </button>
        </Modal>
      )}

      {/* MODAL: Top products */}
      {modal === 'top' && (
        <Modal title={t('dashboard.modal_top_title')} onClose={() => setModal(null)}>
          {(stats.top_products || []).length === 0 ? (
            <p className="text-gray-400 text-center py-8">Hakuna data</p>
          ) : (
            <ul className="space-y-3">
              {stats.top_products.map((p, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800"
                >
                  <span className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty_sold} units sold</p>
                  </div>
                  <span className="font-semibold text-emerald-600">{fmt(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
