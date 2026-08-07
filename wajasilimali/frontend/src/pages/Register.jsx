import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary-950 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">{t('app_name')}</h1>
          <p className="text-gray-500 mt-1">{t('tagline')}</p>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('auth.register_title')}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.full_name')}</label>
            <input
              name="full_name"
              className="input-field"
              value={form.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
            <input
              name="phone"
              className="input-field"
              value={form.phone}
              onChange={handleChange}
              placeholder="+255..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              name="password"
              className="input-field"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? t('common.loading') : t('auth.register_btn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            {t('auth.login_btn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
