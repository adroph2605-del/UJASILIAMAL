import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { productsAPI, salesAPI } from '../services/api';
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Download } from 'lucide-react';

export default function POS() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    productsAPI
      .list({ limit: 200 })
      .then((res) => setProducts(res.data.filter((p) => p.quantity > 0)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search))
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          unit_price: product.selling_price,
          max_qty: product.quantity,
          quantity: 1,
          discount: 0,
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product_id !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty < 1 || newQty > i.max_qty) return i;
          return { ...i, quantity: newQty };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.unit_price * i.quantity - i.discount, 0);
  const total = subtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        payment_method: paymentMethod,
        items: cart.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
        })),
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        amount_paid:
          paymentMethod === 'debt'
            ? parseFloat(amountPaid) || 0
            : total,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
      };
      const res = await salesAPI.create(payload);
      setLastSale(res.data);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setTax(0);
      setAmountPaid('');
      // refresh products stock
      productsAPI.list({ limit: 200 }).then((r) => setProducts(r.data.filter((p) => p.quantity > 0)));
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const downloadReceipt = async () => {
    if (!lastSale) return;
    try {
      const res = await salesAPI.receiptPdf(lastSale.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${lastSale.receipt_number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(t('common.error'));
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat('sw-TZ', { maximumFractionDigits: 0 }).format(n);

  if (lastSale) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="card space-y-4">
          <CheckCircle size={56} className="mx-auto text-emerald-500" />
          <h2 className="text-xl font-bold text-gray-900">{t('pos.success')}</h2>
          <p className="text-gray-600 font-mono">{lastSale.receipt_number}</p>
          <p className="text-2xl font-bold text-primary-700">{fmt(lastSale.total)} TZS</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button onClick={downloadReceipt} className="btn-primary flex items-center justify-center gap-2">
              <Download size={18} />
              {t('pos.print_receipt')}
            </button>
            <button onClick={() => setLastSale(null)} className="btn-secondary">
              {t('pos.new_sale')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('pos.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder={t('inventory.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {loading ? (
            <p className="text-gray-500 text-center py-10">{t('common.loading')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="card text-left hover:ring-2 hover:ring-primary-400 transition p-3"
                >
                  <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                  <p className="text-primary-700 font-bold mt-1">{fmt(p.selling_price)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.quantity} {p.unit}
                  </p>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center text-gray-400 py-8">{t('dashboard.no_data')}</p>
              )}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card sticky top-20 h-fit space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={18} />
            {t('pos.cart')} ({cart.length})
          </h2>

          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">{t('pos.empty_cart')}</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <li key={item.product_id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-gray-500">{fmt(item.unit_price)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Totals */}
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t('pos.subtotal')}</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-600 w-20">{t('pos.discount')}</label>
              <input
                type="number"
                min="0"
                className="input-field py-1 text-sm"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-600 w-20">{t('pos.tax')}</label>
              <input
                type="number"
                min="0"
                className="input-field py-1 text-sm"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </div>
            <div className="flex justify-between text-lg font-bold text-primary-800 pt-1">
              <span>{t('pos.total')}</span>
              <span>{fmt(total)} TZS</span>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('pos.payment_method')}</label>
            <div className="grid grid-cols-3 gap-2">
              {['cash', 'mobile_money', 'debt'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium border transition ${
                    paymentMethod === m
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {t(`pos.${m}`)}
                </button>
              ))}
            </div>
          </div>

          {(paymentMethod === 'debt' || customerName) && (
            <div className="space-y-2">
              <input
                className="input-field text-sm"
                placeholder={t('pos.customer_name')}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                className="input-field text-sm"
                placeholder={t('pos.customer_phone')}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              {paymentMethod === 'debt' && (
                <input
                  type="number"
                  min="0"
                  className="input-field text-sm"
                  placeholder={t('pos.amount_paid')}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              )}
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="btn-primary w-full py-3 text-base"
          >
            {submitting ? t('common.loading') : t('pos.checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}
