import React from 'react';
import { formatCurrency } from '../utils/format';

export function InvoicesSection({ invoices, selectedInvoice, invoiceDetails, onSelect }) {
  return (
    <section className="invoices-view">
      <h2>Invoices</h2>
      <div className="split">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={selectedInvoice?.id === invoice.id ? 'selected' : ''}
                  onClick={() => onSelect(invoice)}
                >
                  <td>{invoice.invoice_number}</td>
                  <td>{invoice.invoice_date}</td>
                  <td>{invoice.customer_name}</td>
                  <td>{formatCurrency(invoice.total)}</td>
                </tr>
              ))}
              {!invoices.length && (
                <tr>
                  <td colSpan={4} className="empty">
                    No invoices recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="invoice-detail">
          {invoiceDetails ? (
            <div>
              <h3>Invoice #{invoiceDetails.invoice.invoice_number}</h3>
              <p>
                <strong>Date:</strong> {invoiceDetails.invoice.invoice_date}
              </p>
              <p>
                <strong>Customer:</strong> {invoiceDetails.invoice.customer_name}
              </p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.item_name}</td>
                        <td>
                          {item.quantity} {item.item_unit}
                        </td>
                        <td>{formatCurrency(item.rate)}</td>
                        <td>{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="summary-box">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCurrency(invoiceDetails.invoice.subtotal)}</strong>
                </div>
                <div>
                  <span>CGST</span>
                  <strong>{formatCurrency(invoiceDetails.invoice.cgst)}</strong>
                </div>
                <div>
                  <span>SGST</span>
                  <strong>{formatCurrency(invoiceDetails.invoice.sgst)}</strong>
                </div>
                <div className="total">
                  <span>Total</span>
                  <strong>{formatCurrency(invoiceDetails.invoice.total)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="placeholder">Select an invoice to view details.</div>
          )}
        </div>
      </div>
    </section>
  );
}
