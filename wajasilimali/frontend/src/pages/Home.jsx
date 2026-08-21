import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Globe } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  const toggleLang = () => {
    const next = i18n.language === 'sw' ? 'en' : 'sw';
    i18n.changeLanguage(next);
    localStorage.setItem('wajasilimali_lang', next);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628]">
        <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    t('home.features.sales'),
    t('home.features.stock'),
    t('home.features.debts'),
    t('home.features.receipts'),
    t('home.features.growth'),
  ];

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex flex-col relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-3xl" />

      <header className="relative z-10 w-full px-4 sm:px-10 py-5 flex items-center justify-between">
        <span className="text-sm font-bold tracking-widest text-white/90">{t('app_name')}</span>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/20 transition"
          >
            <Globe size={14} />
            {i18n.language === 'sw' ? 'EN' : 'SW'}
          </button>
          <Link
            to="/login"
            className="px-5 py-2 text-sm font-semibold rounded-full bg-white text-[#0a1628] hover:bg-teal-50 transition shadow-lg"
          >
            {t('home.sign_in')}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-6 text-center">
        <img
          src={logo}
          alt={t('app_name')}
          className="w-full max-w-xs sm:max-w-sm md:max-w-md h-auto object-contain mb-10 drop-shadow-2xl"
        />

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold max-w-3xl leading-tight mb-5 tracking-tight">
          {t('home.headline')}
        </h1>

        <p className="text-white/70 text-sm sm:text-base max-w-xl mb-10 leading-relaxed">
          {t('home.subheadline')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
          <Link
            to="/login"
            className="w-full sm:w-auto px-10 py-3.5 text-base font-semibold rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black transition shadow-lg shadow-emerald-500/20"
          >
            {t('home.sign_in')}
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-10 py-3.5 text-base font-semibold rounded-full border border-white/30 hover:border-white/60 hover:bg-white/5 transition"
          >
            {t('home.register_link')}
          </Link>
        </div>

        <p className="text-sm text-white/50 mb-12">
          {t('home.no_account')}{' '}
          <Link to="/register" className="text-teal-300 font-medium hover:underline">
            {t('home.register_link')}
          </Link>
        </p>

        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {features.map((item) => (
            <span
              key={item}
              className="px-4 py-1.5 text-xs sm:text-sm font-medium text-white/80 bg-white/10 border border-white/10 rounded-full backdrop-blur-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-white/40 border-t border-white/10 space-y-1">
        <p>
          © {new Date().getFullYear()} {t('app_name')} · {t('home.footer_tag')}
        </p>
        <p>
          {t('home.footer_help')}:{' '}
          <a href="mailto:adroph2605@gmail.com" className="text-teal-300/80 hover:underline">
            adroph2605@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
