import React from 'react';
import { StockNotification } from '../../components/StockNotification';

export function AppHeader({ onLogout, user, company, items }) {
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
          <StockNotification items={items} />
          <span className="badge">
            {user.role === 'admin' ? 'ADMIN' : 'POS'} - {user.name?.toUpperCase()}
          </span>
          <button type="button" className="secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
