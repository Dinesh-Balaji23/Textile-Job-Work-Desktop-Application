import React from 'react';
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
  onDateChange,
  onCustomerChange,
  onAddItem,
  onItemChange,
  onRemoveItem,
  onNotesChange,
  onSubmit
}) {
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
                <th style={{ width: '25%' }}>Item</th>
                <th>Description</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '10%' }}>Rate</th>
                <th style={{ width: '10%' }}>Amount</th>
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
                      value={row.description}
                      onChange={(e) => onItemChange(row.id, 'description', e.target.value)}
                    />
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
                  <td colSpan={6} className="empty">
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
              <span>CGST 2.5%</span>
              <strong>{formatCurrency(invoiceSummary.cgst)}</strong>
            </div>
            <div>
              <span>SGST 2.5%</span>
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
