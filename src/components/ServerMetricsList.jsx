import React, { useState, useEffect } from 'react';

const INITIAL_METRICS = [
  { id: 1, serverId: 'srv-node-01', cpu: 45.5, ram: 60.0, disk: 30.0, traffic: 1200, timestamp: '2026-10-12 10:00' },
  { id: 2, serverId: 'сервер-москва-02', cpu: 85.0, ram: 90.2, disk: 75.4, traffic: 4500, timestamp: '2026-10-12 10:05' },
];

export default function ServerMetricsList() {
  const [metrics, setMetrics] = useState(() => {
    const saved = localStorage.getItem('server_metrics');
    return saved ? JSON.parse(saved) : INITIAL_METRICS;
  });

  const [form, setForm] = useState({ serverId: '', cpu: '', ram: '', disk: '', traffic: '' });
  const [filterServer, setFilterServer] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (JSON.stringify(metrics) === localStorage.getItem('server_metrics')) {
      return;
    }
    
    setSaveStatus('waiting');

    const timer = setTimeout(() => {
      setSaveStatus('saving');
      localStorage.setItem('server_metrics', JSON.stringify(metrics));
      setTimeout(() => setSaveStatus('saved'), 300);
    }, 1000);

    return () => clearTimeout(timer);
  }, [metrics]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.serverId || !form.cpu || !form.ram || !form.disk) return;

    if (editingId !== null) {
      setMetrics(metrics.map(item => 
        item.id === editingId 
          ? { 
              ...item, 
              serverId: form.serverId.trim(),
              cpu: parseFloat(form.cpu),
              ram: parseFloat(form.ram),
              disk: parseFloat(form.disk),
              traffic: parseInt(form.traffic || 0, 10)
            } 
          : item
      ));
      setEditingId(null);
    } else {
      const newMetric = {
        id: Date.now(),
        serverId: form.serverId.trim(),
        cpu: parseFloat(form.cpu),
        ram: parseFloat(form.ram),
        disk: parseFloat(form.disk),
        traffic: parseInt(form.traffic || 0, 10),
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
      setMetrics([newMetric, ...metrics]);
    }

    setForm({ serverId: '', cpu: '', ram: '', disk: '', traffic: '' });
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setForm({
      serverId: item.serverId,
      cpu: item.cpu,
      ram: item.ram,
      disk: item.disk,
      traffic: item.traffic
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ serverId: '', cpu: '', ram: '', disk: '', traffic: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Удалить эту запись?')) {
      setMetrics(metrics.filter((item) => item.id !== id));
      if (editingId === id) handleCancelEdit();
    }
  };

  const filteredMetrics = filterServer
    ? metrics.filter((item) => 
        item.serverId.toLocaleLowerCase('ru').includes(filterServer.toLocaleLowerCase('ru'))
      )
    : metrics;

  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    if (sortBy === 'cpu-desc') return b.cpu - a.cpu;
    if (sortBy === 'cpu-asc') return a.cpu - b.cpu;
    if (sortBy === 'name') {
      return a.serverId.localeCompare(b.serverId, 'ru', { numeric: true, sensitivity: 'base' });
    }
    return 0;
  });

  const renderSaveStatus = () => {
    if (saveStatus === 'saved') return <span className="status-badge status-saved">✓ Сохранено</span>;
    if (saveStatus === 'waiting') return <span className="status-badge status-waiting">⏳ Ожидание изменений...</span>;
    if (saveStatus === 'saving') return <span className="status-badge status-saving">💾 Сохранение...</span>;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        <header className="dashboard-header">
          <h1 className="dashboard-title">
            Dashboard <span>Метрики серверов</span>
          </h1>
          {renderSaveStatus()}
        </header>

        {/* Форма добавления / редактирования */}
        <div className="card">
          <h3 className="card-title">
            {editingId !== null ? `Редактирование записи #${editingId}` : 'Добавить новую запись'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-grid">
              <input 
                type="text" placeholder="ID Сервера" value={form.serverId} 
                onChange={e => setForm({...form, serverId: e.target.value})} 
                required maxLength={50} className="form-input"
              />
              <input 
                type="number" step="0.1" min="0" max="100" placeholder="CPU %" value={form.cpu} 
                onChange={e => setForm({...form, cpu: e.target.value})} 
                required className="form-input"
              />
              <input 
                type="number" step="0.1" min="0" max="100" placeholder="RAM %" value={form.ram} 
                onChange={e => setForm({...form, ram: e.target.value})} 
                required className="form-input"
              />
              <input 
                type="number" step="0.1" min="0" max="100" placeholder="Диск %" value={form.disk} 
                onChange={e => setForm({...form, disk: e.target.value})} 
                required className="form-input"
              />
              <input 
                type="number" min="0" placeholder="Kbps" value={form.traffic} 
                onChange={e => setForm({...form, traffic: e.target.value})} 
                className="form-input"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn">
                {editingId !== null ? 'Сохранить изменения' : '+ Добавить метрику'}
              </button>
              {editingId !== null && (
                <button type="button" onClick={handleCancelEdit} className="btn btn-btn-cancel" style={{ background: '#64748b' }}>
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Панель фильтрации и сортировки */}
        <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text" 
              placeholder="🔍 Поиск по ID сервера..." 
              value={filterServer} 
              onChange={e => setFilterServer(e.target.value)}
              className="form-input search-input"
            />
          </div>
          <div>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="form-input sort-select"
              style={{ cursor: 'pointer' }}
            >
              <option value="default">Сортировка: по умолчанию</option>
              <option value="cpu-desc">CPU: от большего к меньшему</option>
              <option value="cpu-asc">CPU: от меньшего к большему</option>
              <option value="name">По имени сервера (А-Я)</option>
            </select>
          </div>
        </div>

        {/* Таблица */}
        <div className="card">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Сервер</th>
                <th>CPU</th>
                <th>RAM</th>
                <th>Диск</th>
                <th>Сеть</th>
                <th style={{ textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedMetrics.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Записей не найдено</td></tr>
              ) : (
                sortedMetrics.map((item) => (
                  <tr key={item.id} style={{ background: editingId === item.id ? '#f8fafc' : 'transparent' }}>
                    <td>
                      <div className="server-name-bold">{item.serverId}</div>
                      <div className="server-time-muted">{item.timestamp}</div>
                    </td>
                    <td>
                      <span className={item.cpu > 80 ? 'badge-danger' : 'badge-success'}>
                        {item.cpu.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className={item.ram > 85 ? 'badge-danger' : 'badge-success'}>
                        {item.ram.toFixed(1)}%
                      </span>
                    </td>
                    <td className="cell-metric-text">{item.disk.toFixed(1)}%</td>
                    <td className="cell-metric-text">{item.traffic.toLocaleString()} Kbps</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleEditClick(item)} 
                        className="btn-delete btn-edit-highlight"
                      >
                        Изменить
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn-delete">
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="dashboard-footer">
          Лабораторная работа №4 | Управление состоянием в React | 2026
        </footer>
      </div>
    </div>
  );
}