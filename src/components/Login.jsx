import React, { useState } from 'react';
import api from '../api';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);

        const userRole = response.data.user?.role || 'user';
        localStorage.setItem('userRole', userRole);

        onLoginSuccess(userRole);
      }
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError(err.response?.data?.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">🛡️ Авторизация</h2>
          <p className="login-subtitle">Система мониторинга серверов</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div>
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={50}
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="login-label">Пароль</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={50}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Проверка данных...' : 'Войти в систему'}
          </button>
        </form>
      </div>
    </div>
  );
}