import React, { useState } from 'react';
import { formatCurrency } from '../utils/format';
import { downloadInvoicePDF } from '../../utils/invoicePDF';

// PDF Invoice functionality
export const InvoicesSection = React.memo(function InvoicesSection({ invoices, selectedInvoice, invoiceDetails, company, onSelect }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const totalPages = Math.max(1, Math.ceil(invoices.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = invoices.slice(startIndex, startIndex + itemsPerPage);

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
              {paginatedInvoices.map((invoice) => (
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
              {!paginatedInvoices.length && (
                <tr>
                  <td colSpan={4} className="empty">
                    No invoices recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="invoice-detail">
          {invoiceDetails ? (
            <div>
              <div className="invoice-header-actions">
                <h3>Invoice #{invoiceDetails.invoice.invoice_number}</h3>
                <button 
                  className="primary"
                  onClick={() => downloadInvoicePDF(
                    invoiceDetails.invoice,
                    company,
                    {
                      name: invoiceDetails.invoice.customer_name,
                      address: invoiceDetails.invoice.customer_address,
                      gstin: invoiceDetails.invoice.customer_gstin,
                      state: invoiceDetails.invoice.customer_state,
                      state_code: invoiceDetails.invoice.customer_state_code
                    },
                    invoiceDetails.items
                  )}
                >
                  Download PDF
                </button>
              </div>
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
});
