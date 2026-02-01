import React from 'react';

export function AppHeader({ onLogout, user, company }) {
  const name = company?.name?.trim() || 'Textile Job Work POS';
  const location = company?.address?.trim() || 'Location pending';

  return (
    <header className="app-header">
      <div className="logo-circle">{name?.slice(0, 2)?.toUpperCase() || 'TP'}</div>
      <div>
        <p className="subtitle">{location}</p>
        <h1>{name}</h1>
      </div>
      {user && (
        <div className="header-actions">
          <span className="badge">{user.role === 'admin' ? 'Admin' : 'POS'}</span>
          <button type="button" className="secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
