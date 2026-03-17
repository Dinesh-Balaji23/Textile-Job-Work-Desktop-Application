import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/format';
import { razorpayService } from '../../utils/razorpayService';

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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'online'

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

  useEffect(() => {
    // Listen for Razorpay payment success
    const handlePaymentSuccess = async (event) => {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, invoiceData } = event.detail;
      
      try {
        // Verify payment with backend
        const verification = await window.electronAPI.invoke('razorpay:verifyPayment', {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature
        });

        if (verification.verified) {
          // Save payment record
          await window.electronAPI.invoke('razorpay:savePaymentRecord', {
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            invoice_number: invoiceData.invoice_number,
            amount: invoiceData.total,
            status: 'paid',
            payment_method: 'razorpay'
          });

          // Now save the actual invoice to the database
          await onSubmit(new Event('submit')); // Trigger the original invoice save

          alert('Payment successful! Invoice saved.');
          setPaymentProcessing(false);
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        alert('Payment verification failed. Please contact support.');
        setPaymentProcessing(false);
      }
    };

    document.addEventListener('razorpay:payment-success', handlePaymentSuccess);
    return () => document.removeEventListener('razorpay:payment-success', handlePaymentSuccess);
  }, [onSubmit]);

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (paymentMethod === 'online') {
      await processOnlinePayment(e);
    } else {
      onSubmit(e);
    }
  };

  const processOnlinePayment = async (e) => {
    e.preventDefault();
    
    if (invoiceItems.length === 0) {
      alert('Please add items before proceeding with payment.');
      return;
    }

    setPaymentProcessing(true);

    try {
      // For test mode, use shop details instead of customer selection
      const customer = {
        name: 'Test Customer', // Default test customer name
        email: 'test@example.com',
        phone: '9999999999'
      };
      
      // Create invoice data with validation
      const invoiceData = {
        invoice_number: nextInvoiceNumber,
        total: invoiceSummary.total || 0,
        subtotal: invoiceSummary.subtotal || 0,
        cgst: invoiceSummary.cgst || 0,
        sgst: invoiceSummary.sgst || 0
      };

      console.log('Processing payment with data:', { invoiceData, customer });

      // Process payment with Razorpay
      await razorpayService.processPayment(invoiceData, customer);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      alert(`Payment failed: ${error.message}`);
      setPaymentProcessing(false);
    }
  };

  return (
    <section>
      <div className="invoice-header">
        <div>
          <h2>Create Invoice</h2>
          <p>Invoice No. {nextInvoiceNumber}</p>
        </div>
      </div>
      <form onSubmit={handlePayment}>
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
            
            {/* Payment Method Selection */}
            <div className="payment-method">
              <label>
                Payment Method
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ marginBottom: '10px', width: '100%', padding: '5px' }}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online Payment (Razorpay)</option>
                </select>
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={paymentProcessing}
              style={{ 
                backgroundColor: paymentMethod === 'online' ? '#3399cc' : '#28a745',
                cursor: paymentProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {paymentProcessing ? 'Processing...' : 
               paymentMethod === 'online' ? 'Pay Online' : 'Save Invoice'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
