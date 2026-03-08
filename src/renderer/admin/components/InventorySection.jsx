
import React, { useState } from 'react';
import { formatCurrency } from '../utils/format';

export function InventorySection({
  form,
  editingItemId,
  units,
  items,
  onFieldChange,
  onSubmit,
  onEdit,
  onCancelEdit,
  onRefresh,
  onDelete // Add delete callback
}) {
  const [csvFile, setCsvFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(null); // Renamed to avoid conflict
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState(''); // Add missing searchTerm state

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 4) {
        data.push({
          name: values[0] || '',
          category: values[1] || '',
          unit: values[2] || 'pieces',
          rate: parseFloat(values[3]) || 0,
          quantity: parseFloat(values[4]) || 0
        });
      }
    }
    
    return data;
  };

  const handleImport = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first');
      return;
    }

    setIsImporting(true);
    try {
      const text = await csvFile.text();
      const importItems = parseCSV(text);
      
      if (importItems.length === 0) {
        alert('No valid items found in CSV file');
        setIsImporting(false);
        return;
      }

      // Get existing items to check for duplicates
      const existingItems = items || [];
      const existingItemMap = new Map();
      existingItems.forEach(item => {
        existingItemMap.set(item.name.toLowerCase().trim(), item);
      });

      let updatedCount = 0;
      let addedCount = 0;

      // Process each import item
      for (const importItem of importItems) {
        try {
          const existingItem = existingItemMap.get(importItem.name.toLowerCase().trim());
          
          if (existingItem) {
            // Update existing item - add quantities
            const updatedQuantity = existingItem.quantity + importItem.quantity;
            await window.api.updateItem({
              ...existingItem,
              quantity: updatedQuantity
            });
            updatedCount++;
          } else {
            // Add new item
            await window.api.createItem(importItem);
            addedCount++;
          }
        } catch (error) {
          console.error('Failed to process item:', importItem.name, error);
        }
      }
      
      const message = [];
      if (updatedCount > 0) {
        message.push(`Updated ${updatedCount} existing items`);
      }
      if (addedCount > 0) {
        message.push(`Added ${addedCount} new items`);
      }
      
      alert(`Import complete: ${message.join(', ')}`);
      setCsvFile(null);
      document.getElementById('csv-upload').value = '';
      
      // Refresh the items list to show updated data
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert('Failed to import CSV: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    try {
      await window.api.deleteItem(id);
      setDeleteStatus('Item deleted successfully');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setDeleteStatus('Failed to delete item: ' + error.message);
    }
  };

  // Clear delete message after 3 seconds
  React.useEffect(() => {
    if (deleteStatus) {
      const timer = setTimeout(() => setDeleteStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteStatus]);

  // Show delete status message if onDelete prop exists and is a function
  const showDeleteStatus = onDelete && typeof onDelete === 'function';
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const categories = ['all', ...new Set(items.map(item => item.category).filter(Boolean))];

  return (
    <section className="inventory-section">
      <div className="inventory-header">
        <h2>Inventory Management</h2>
        <div className="inventory-stats">
          <div className="stat-card">
            <span className="stat-number">{items.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            <span className="stat-label">Total Quantity</span>
          </div>
        </div>
      </div>

      {/* Main Inventory List - Takes most of the space */}
      <div className="inventory-list-main">
        <div className="list-header">
          <h3>Item Inventory</h3>
          <div className="list-filters">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delete Status Message */}
        {showDeleteStatus && deleteStatus && (
          <div className={`delete-status ${deleteStatus.includes('success') ? 'success' : 'error'}`}>
            {deleteStatus}
          </div>
        )}

        <div className="table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Rate</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="inventory-row">
                    <td className="item-name">{item.name}</td>
                    <td className="item-category">
                      <span className="category-badge">{item.category || 'Uncategorized'}</span>
                    </td>
                    <td className="item-unit">{item.unit}</td>
                    <td className="item-quantity">
                      <span className={`quantity-badge ${item.quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="item-rate">{formatCurrency(item.rate)}</td>
                    <td className="item-value">{formatCurrency(item.quantity * item.rate)}</td>
                    <td className="item-actions">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="action-btn edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="action-btn delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-message">
                      <span className="empty-icon">📦</span>
                      <p>No items found</p>
                      <p>Try adjusting your search or add new items</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms Section - Side by side on desktop */}
      <div className="inventory-forms-section">
        {/* Add/Edit Form */}
        <div className="inventory-form">
          <form className="form-grid" onSubmit={onSubmit}>
            <div className="form-section">
              <h3>{editingItemId ? 'Edit Item' : 'Add New Item'}</h3>
              <div className="form-grid">
                <label>
                  Item Name
                  <input
                    required
                    value={form.name}
                    onChange={(e) => onFieldChange('name', e.target.value)}
                    placeholder="Enter item name"
                  />
                </label>
                <label>
                  Category
                  <input 
                    value={form.category} 
                    onChange={(e) => onFieldChange('category', e.target.value)}
                    placeholder="e.g., Clothing, Accessories"
                  />
                </label>
                <label>
                  Unit
                  <select value={form.unit} onChange={(e) => onFieldChange('unit', e.target.value)}>
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Available Qty
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => onFieldChange('quantity', e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label>
                  Rate (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.rate}
                    onChange={(e) => onFieldChange('rate', e.target.value)}
                    placeholder="0.00"
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary">
                  {editingItemId ? 'Update Item' : 'Add Item'}
                </button>
                {editingItemId && (
                  <button type="button" className="secondary" onClick={onCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* CSV Import Section */}
        <div className="csv-import-section">
          <h3>Bulk Import</h3>
          <div className="csv-upload-area">
            <div className="file-upload-wrapper">
              <label htmlFor="csv-upload" className="file-upload-btn">
                <span className="upload-icon">📁</span>
                <span>{csvFile ? csvFile.name : 'Choose CSV File'}</span>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                />
              </label>
            </div>
            <div className="csv-format-info">
              <h4>CSV Format:</h4>
              <code>name, category, unit, rate, quantity</code>
              <p><strong>Example:</strong> Shirt, Clothing, pieces, 150, 50</p>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={!csvFile || isImporting}
              className="import-btn primary"
            >
              {isImporting ? 'Importing...' : 'Import Items'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
