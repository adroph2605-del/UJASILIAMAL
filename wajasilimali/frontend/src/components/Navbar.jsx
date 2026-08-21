import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, Globe, Menu, X, Shield, Sun, Moon,
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'sw' ? 'en' : 'sw';
    i18n.changeLanguage(next);
    localStorage.setItem('wajasilimali_lang', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/inventory', icon: Package, label: t('nav.inventory') },
    { to: '/pos', icon: ShoppingCart, label: t('nav.pos') },
    { to: '/debtors', icon: Users, label: t('nav.debtors') },
  ];
  if (user?.role === 'admin') {
    links.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-primary-800 dark:bg-gray-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-bold text-xl tracking-tight">{t('app_name')}</Link>
            <span className="hidden sm:inline text-primary-200 text-xs">{t('tagline')}</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(to) ? 'bg-primary-600 text-white' : 'text-primary-100 hover:bg-primary-700 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-primary-700 hover:bg-primary-600 dark:bg-gray-800"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-700 hover:bg-primary-600 text-sm font-medium"
            >
              <Globe size={16} />
              {i18n.language === 'sw' ? 'EN' : 'SW'}
            </button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-primary-200">{user.full_name}</span>
                <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-primary-700">
                  <LogOut size={18} />
                </button>
              </div>
            )}
            <button className="md:hidden p-2 rounded-lg hover:bg-primary-700" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(to) ? 'bg-primary-600' : 'hover:bg-primary-700'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
