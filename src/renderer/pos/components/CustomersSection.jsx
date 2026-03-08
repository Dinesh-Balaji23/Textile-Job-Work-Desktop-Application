import React from 'react';

export function CustomersSection({
  form,
  editingCustomerId,
  customers,
  onFieldChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit
}) {
  return (
    <section>
      <h2>Customers / Mills</h2>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
          />
        </label>
        <label>
          GSTIN
          <input value={form.gstin} onChange={(e) => onFieldChange('gstin', e.target.value)} />
        </label>
        <label>
          State
          <input value={form.state} onChange={(e) => onFieldChange('state', e.target.value)} />
        </label>
        <label>
          State Code
          <input
            value={form.state_code}
            onChange={(e) => onFieldChange('state_code', e.target.value)}
          />
        </label>
        <label className="full">
          Address
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => onFieldChange('address', e.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="submit">{editingCustomerId ? 'Update' : 'Add'} Customer</button>
          {editingCustomerId && (
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
              <th>GSTIN</th>
              <th>State</th>
              <th>State Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.gstin || '-'}</td>
                <td>{customer.state || '-'}</td>
                <td>{customer.state_code || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      type="button" 
                      onClick={() => onEdit(customer)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => onDelete(customer.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={5} className="empty">
                  No customers added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
