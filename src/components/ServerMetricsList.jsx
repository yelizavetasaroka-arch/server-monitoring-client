import React, { useState, useEffect } from 'react';
import { fetchMetrics, addMetric, updateMetric, deleteMetric } from '../api';
import './ServerMetricsList.css'; 

export default function ServerMetricsList({ userRole }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ 
    serverId: '', 
    cpuUsagePercent: '', 
    ramUsagePercent: '', 
    diskUsagePercent: '', 
    networkTrafficKbps: '' 
  });
  const [filterServer, setFilterServer] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [editingId, setEditingId] = useState(null);

  const loadData = async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMetrics(searchQuery);
      setMetrics(response.data.data || response.data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError('Не удалось подключиться к серверу. Проверьте, запущен ли бэкенд.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(filterServer);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [filterServer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serverId || form.cpuUsagePercent === '' || form.ramUsagePercent === '' || form.diskUsagePercent === '') return;

    const formattedData = {
      serverId: form.serverId.trim(),
      cpuUsagePercent: parseFloat(form.cpuUsagePercent),
      ramUsagePercent: parseFloat(form.ramUsagePercent),
      diskUsagePercent: parseFloat(form.diskUsagePercent),
      networkTrafficKbps: form.networkTrafficKbps !== '' ? parseFloat(form.networkTrafficKbps) : 0,
    };

    if (editingId !== null) {
      const previousMetrics = [...metrics];
      setMetrics(metrics.map(item => item.id === editingId ? { ...item, ...formattedData } : item));
      const currentEditingId = editingId;
      setEditingId(null);
      setForm({ serverId: '', cpuUsagePercent: '', ramUsagePercent: '', diskUsagePercent: '', networkTrafficKbps: '' });

      try {
        await updateMetric(currentEditingId, formattedData);
      } catch (err) {
        console.error('Ошибка обновления на сервере:', err);
        alert('Ошибка при обновлении на сервере. Изменения откатаны.');
        setMetrics(previousMetrics);
      }
    } else {
      const tempId = Date.now();
      const optimisticItem = { id: tempId, ...formattedData, createdAt: new Date().toISOString() };

      setMetrics([optimisticItem, ...metrics]);
      setForm({ serverId: '', cpuUsagePercent: '', ramUsagePercent: '', diskUsagePercent: '', networkTrafficKbps: '' });

      try {
        const response = await addMetric(formattedData);
        if (response.data && (response.data.data || response.data.id)) {
          const savedItem = response.data.data || response.data;
          setMetrics(prev => prev.map(item => item.id === tempId ? savedItem : item));
        }
      } catch (err) {
        console.error('Ошибка добавления на сервере:', err);
        alert('Не удалось сохранить запись на сервере.');
        setMetrics(prev => prev.filter(item => item.id !== tempId));
      }
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setForm({
      serverId: item.serverId,
      cpuUsagePercent: item.cpuUsagePercent,
      ramUsagePercent: item.ramUsagePercent,
      diskUsagePercent: item.diskUsagePercent,
      networkTrafficKbps: item.networkTrafficKbps || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ serverId: '', cpuUsagePercent: '', ramUsagePercent: '', diskUsagePercent: '', networkTrafficKbps: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту запись?')) return;

    const previousMetrics = [...metrics];
    setMetrics(metrics.filter((item) => item.id !== id));
    if (editingId === id) handleCancelEdit();

    try {
      await deleteMetric(id);
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить запись на сервере.');
      setMetrics(previousMetrics);
    }
  };

  const sortedMetrics = [...metrics].sort((a, b) => {
    if (sortBy === 'cpu-desc') return (b.cpuUsagePercent || 0) - (a.cpuUsagePercent || 0);
    if (sortBy === 'cpu-asc') return (a.cpuUsagePercent || 0) - (b.cpuUsagePercent || 0);
    if (sortBy === 'name') {
      return (a.serverId || '').localeCompare(b.serverId || '', 'ru');
    }
    return 0;
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        <header className="dashboard-header">
          <h1 className="dashboard-title">
            Dashboard <span>Метрики серверов (API)</span>
          </h1>
          <div>
            {loading && <span className="sync-status">⏳ Синхронизация с сервером...</span>}
          </div>
        </header>

        {error && (
          <div className="error-box">
            <p><strong>Ошибка:</strong> {error}</p>
            <button onClick={() => loadData(filterServer)} className="retry-button">
              Повторить попытку
            </button>
          </div>
        )}

        {loading && metrics.length === 0 ? (
          <div className="loading-state">
            <div className="spinner">Загрузка данных с сервера...</div>
          </div>
        ) : (
          <>
            {/* Форма добавления / редактирования (ТОЛЬКО ДЛЯ АДМИНА) */}
            {userRole === 'admin' && (
              <div className="card form-card">
                <h3 className="card-title">
                  {editingId !== null ? `Редактирование записи #${editingId}` : 'Добавить новую запись'}
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-grid">
                    <input 
                      type="text" placeholder="ID Сервера" value={form.serverId} 
                      onChange={e => setForm({...form, serverId: e.target.value})} 
                      required className="form-input"
                    />
                    <input 
                      type="number" step="0.1" min="0" max="100" placeholder="CPU %" value={form.cpuUsagePercent} 
                      onChange={e => setForm({...form, cpuUsagePercent: e.target.value})} 
                      required className="form-input"
                    />
                    <input 
                      type="number" step="0.1" min="0" max="100" placeholder="RAM %" value={form.ramUsagePercent} 
                      onChange={e => setForm({...form, ramUsagePercent: e.target.value})} 
                      required className="form-input"
                    />
                    <input 
                      type="number" step="0.1" min="0" max="100" placeholder="Диск %" value={form.diskUsagePercent} 
                      onChange={e => setForm({...form, diskUsagePercent: e.target.value})} 
                      required className="form-input"
                    />
                    <input 
                      type="number" step="0.01" min="0" placeholder="Kbps" value={form.networkTrafficKbps} 
                      onChange={e => setForm({...form, networkTrafficKbps: e.target.value})} 
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      {editingId !== null ? 'Сохранить изменения' : '+ Добавить метрику'}
                    </button>
                    {editingId !== null && (
                      <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                        Отмена
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Панель фильтрации и сортировки */}
            <div className="card filter-panel">
              <div style={{ flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="🔍 Поиск по ID сервера (на сервере)..." 
                  value={filterServer} 
                  onChange={e => setFilterServer(e.target.value)}
                  className="search-input"
                />
              </div>
              <div>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="default">Сортировка: по умолчанию</option>
                  <option value="cpu-desc">CPU: от большего к меньшему</option>
                  <option value="cpu-asc">CPU: от меньшего к большему</option>
                  <option value="name">По имени сервера (А-Я)</option>
                </select>
              </div>
            </div>

            {/* Таблица */}
            <div className="card table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Сервер</th>
                    <th>CPU</th>
                    <th>RAM</th>
                    <th>Диск</th>
                    <th>Сеть</th>
                    {userRole === 'admin' && <th className="action-cell">Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedMetrics.length === 0 ? (
                    <tr className="empty-row"><td colSpan={userRole === 'admin' ? 6 : 5}>Записей не найдено</td></tr>
                  ) : (
                    sortedMetrics.map((item) => (
                      <tr key={item.id} className={editingId === item.id ? 'editing-row' : ''}>
                        <td>
                          <div className="server-name">{item.serverId}</div>
                          <div className="server-date">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${Number(item.cpuUsagePercent) > 80 ? 'badge-danger' : 'badge-success'}`}>
                            {Number(item.cpuUsagePercent || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td>
                          <span>{Number(item.ramUsagePercent || 0).toFixed(1)}%</span>
                        </td>
                        <td>{Number(item.diskUsagePercent || 0).toFixed(1)}%</td>
                        <td>{Number(item.networkTrafficKbps || 0).toLocaleString()} Kbps</td>
                        
                        {userRole === 'admin' && (
                          <td className="action-cell">
                            <button onClick={() => handleEditClick(item)} className="btn-edit">
                              Изменить
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="btn-delete">
                              Удалить
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <footer className="dashboard-footer">
          Лабораторная работа №5 | Взаимодействие с сервером | 2026
        </footer>
      </div>
    </div>
  );
}