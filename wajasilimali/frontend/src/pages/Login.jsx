import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Globe } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'sw' ? 'en' : 'sw';
    i18n.changeLanguage(next);
    localStorage.setItem('wajasilimali_lang', next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left brand panel — Spotify/LinkedIn style */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#1e3a5f] to-[#0d9488] flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/40 via-transparent to-transparent" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="" className="h-12 w-auto object-contain brightness-110" />
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            {t('app_name')}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">{t('tagline')}</p>
          <p className="mt-6 text-sm text-white/60">{t('home.subheadline')}</p>
        </div>
        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} {t('app_name')}
        </p>
      </div>

      {/* Right form */}
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

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden text-center mb-8">
              <img src={logo} alt={t('app_name')} className="h-16 w-auto mx-auto object-contain mb-3" />
              <p className="text-sm text-gray-500">{t('tagline')}</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {t('auth.login_title')}
            </h2>
            <p className="text-sm text-gray-500 mb-8">{t('auth.welcome')}</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#0a66c2] hover:bg-[#004182] text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('auth.login_btn')}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-[#0a66c2] font-semibold hover:underline">
                {t('auth.register_btn')}
              </Link>
            </p>
            <p className="mt-4 text-center">
              <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
                ← {t('app_name')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
