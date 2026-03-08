import React, { useState, useEffect } from 'react';

export function StockNotification({ items }) {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const STOCK_THRESHOLD = 20;

  useEffect(() => {
    if (items && items.length > 0) {
      const lowStock = items.filter(item => item.quantity < STOCK_THRESHOLD);
      setLowStockItems(lowStock);
    }
  }, [items]);

  const notificationCount = lowStockItems.length;

  return (
    <div className="stock-notification">
      <button 
        className="notification-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="notification-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount}</span>
          )}
        </div>
      </button>
      
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Low Stock Alerts</h4>
            <span className="notification-count">{notificationCount} items</span>
          </div>
          <div className="notification-list">
            {notificationCount > 0 ? (
              lowStockItems.map(item => (
                <div key={item.id} className="notification-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">{item.quantity} {item.unit}</span>
                  </div>
                  <div className="item-category">{item.category || 'Uncategorized'}</div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <span className="no-notifications-icon">✓</span>
                <p>All items are well stocked</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
