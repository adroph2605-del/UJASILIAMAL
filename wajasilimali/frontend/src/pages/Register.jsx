import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Globe } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    business_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'sw' ? 'en' : 'sw';
    i18n.changeLanguage(next);
    localStorage.setItem('wajasilimali_lang', next);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(t('auth.must_accept_terms'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role: 'admin' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#1e3a5f] to-[#0d9488] flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-400/30 via-transparent to-transparent" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="" className="h-12 w-auto object-contain brightness-110" />
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">{t('app_name')}</h1>
          <p className="text-lg text-white/80">{t('tagline')}</p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('home.features.sales')} · {t('home.features.stock')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {t('home.features.debts')} · {t('home.features.receipts')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {t('home.features.growth')}
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} {t('app_name')}
        </p>
      </div>

      <div className="flex-1 flex flex-col bg-[#fafafa] dark:bg-gray-950">
        <div className="flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 transition shadow-sm"
          >
            <Globe size={16} />
            {i18n.language === 'sw' ? 'English' : 'Kiswahili'}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-10">
          <div className="w-full max-w-[420px]">
            <div className="lg:hidden text-center mb-6">
              <img src={logo} alt={t('app_name')} className="h-14 w-auto mx-auto object-contain mb-2" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {t('auth.register_title')}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{t('tagline')}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.business_name')} *
                </label>
                <input
                  name="business_name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={form.business_name}
                  onChange={handleChange}
                  placeholder={t('auth.business_placeholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.full_name')} *
                </label>
                <input
                  name="full_name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.phone')}
                </label>
                <input
                  name="phone"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+255..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  className="mt-1 rounded"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  {t('auth.accept_terms')}{' '}
                  <Link to="/terms" className="text-[#0a66c2] underline" target="_blank">
                    {t('auth.terms_link')}
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="w-full py-3.5 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50 mt-2"
              >
                {loading ? t('common.loading') : t('auth.register_btn')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="text-[#0a66c2] font-semibold hover:underline">
                {t('auth.login_btn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
