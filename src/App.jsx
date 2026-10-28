import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ServerMetricsList from './components/ServerMetricsList';
import api from './api';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем при монтировании, есть ли уже сохраненный токен и роль
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (token) {
      setIsAuthenticated(true);
      setUserRole(role || 'user');
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) {
    return <div className="app-loading">Загрузка...</div>;
  }

  // Если не авторизован — показываем только форму входа
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      <div className="app-header">
        <button onClick={handleLogout} className="btn-logout">
          Выйти из системы
        </button>
      </div>
      <ServerMetricsList userRole={userRole} />
    </div>
  );
}