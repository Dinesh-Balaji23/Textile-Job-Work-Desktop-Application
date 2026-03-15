import React, { useEffect } from 'react';
import { formatCurrency } from '../utils/format';

export function BillingSection({
  nextInvoiceNumber,
  invoiceDate,
  invoiceCustomerId,
  customers,
  invoiceItems,
  invoiceNotes,
  invoiceSummary,
  items,
  gstSettings,
  onDateChange,
  onCustomerChange,
  onAddItem,
  onItemChange,
  onRemoveItem,
  onNotesChange,
  onSubmit
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSubmit(e);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        onAddItem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSubmit, onAddItem]);

  return (
    <section>
      <div className="invoice-header">
        <div>
          <h2>Create Invoice</h2>
          <p>Invoice No. {nextInvoiceNumber}</p>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div className="invoice-meta">
          <label>
            Invoice Date
            <input type="date" value={invoiceDate} onChange={(e) => onDateChange(e.target.value)} />
          </label>
          <label>
            Customer
            <select value={invoiceCustomerId} onChange={(e) => onCustomerChange(e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Item</th>
                <th style={{ width: '15%' }}>Qty</th>
                <th style={{ width: '15%' }}>Rate</th>
                <th style={{ width: '15%' }}>Amount</th>
                <th style={{ width: '10%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((row) => (
                <tr key={row.id}>
                  <td>
                    <select
                      value={row.item_id}
                      onChange={(e) => onItemChange(row.id, 'item_id', e.target.value)}
                      required
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.quantity}
                      onChange={(e) => onItemChange(row.id, 'quantity', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.rate}
                      onChange={(e) => onItemChange(row.id, 'rate', e.target.value)}
                      required
                    />
                  </td>
                  <td>{formatCurrency(row.amount || 0)}</td>
                  <td>
                    <button type="button" className="danger" onClick={() => onRemoveItem(row.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {!invoiceItems.length && (
                <tr>
                  <td colSpan={5} className="empty">
                    Add items to start billing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="invoice-actions">
          <button type="button" onClick={onAddItem}>
            + Add Item
          </button>
        </div>

        <div className="invoice-summary">
          <div>
            <label>
              Notes
              <textarea
                rows={3}
                value={invoiceNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Optional notes"
              />
            </label>
          </div>
          <div className="summary-box">
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(invoiceSummary.subtotal)}</strong>
            </div>
            <div>
              <span>CGST {gstSettings.enabled ? (invoiceSummary.cgstRate || 2.5) : 0}%</span>
              <strong>{formatCurrency(invoiceSummary.cgst)}</strong>
            </div>
            <div>
              <span>SGST {gstSettings.enabled ? (invoiceSummary.sgstRate || 2.5) : 0}%</span>
              <strong>{formatCurrency(invoiceSummary.sgst)}</strong>
            </div>
            <div className="total">
              <span>Total</span>
              <strong>{formatCurrency(invoiceSummary.total)}</strong>
            </div>
            <button type="submit">Save Invoice</button>
          </div>
        </div>
      </form>
    </section>
  );
}
