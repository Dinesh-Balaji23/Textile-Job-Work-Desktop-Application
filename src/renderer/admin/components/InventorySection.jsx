import React from 'react';
import { formatCurrency } from '../utils/format';

export function InventorySection({
  form,
  editingItemId,
  units,
  items,
  onFieldChange,
  onSubmit,
  onEdit,
  onCancelEdit
}) {
  return (
    <section>
      <h2>Inventory Management</h2>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Item Name
          <input
            required
            value={form.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
          />
        </label>
        <label>
          Category
          <input value={form.category} onChange={(e) => onFieldChange('category', e.target.value)} />
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
          />
        </label>
        <label>
          Rate
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.rate}
            onChange={(e) => onFieldChange('rate', e.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="submit">{editingItemId ? 'Update Item' : 'Add Item'}</button>
          {editingItemId && (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Available Qty</th>
              <th>Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category || '-'}</td>
                <td>{item.unit}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.rate)}</td>
                <td>
                  <button type="button" onClick={() => onEdit(item)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6} className="empty">
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
