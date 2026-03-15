import React, { useState, useEffect } from 'react';
import { downloadReportPDF } from '../../utils/reportPDF';

export const ReportsSection = React.memo(function ReportsSection() {
  const [activeReport, setActiveReport] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let data;
      
      switch (activeReport) {
        case 'sales':
          data = await window.api.getSalesReport({ startDate, endDate });
          break;
        case 'gst':
          data = await window.api.getGSTReport({ startDate, endDate });
          break;
        case 'inventory':
          data = await window.api.getInventoryReport();
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadPDF = () => {
    if (!reportData) return;
    
    try {
      const reportTitle = activeReport === 'sales' ? 'Sales Report' : 
                         activeReport === 'gst' ? 'GST Report' : 'Inventory Report';
      const dateRange = activeReport !== 'inventory' ? { startDate, endDate } : null;
      
      downloadReportPDF(reportTitle, reportData, dateRange);
    } catch (error) {
      setError('Failed to generate PDF: ' + error.message);
    }
  };

  const renderSalesReport = () => {
    if (!reportData) return null;

    const { data, totals } = reportData;

    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-card">
            <h3>Total Sales</h3>
            <p className="summary-value">{formatCurrency(totals.totalSales)}</p>
          </div>
          <div className="summary-card">
            <h3>Total Bills</h3>
            <p className="summary-value">{totals.totalBills}</p>
          </div>
          <div className="summary-card">
            <h3>Total Items Sold</h3>
            <p className="summary-value">{totals.totalItems}</p>
          </div>
          <div className="summary-card">
            <h3>Average Bill Value</h3>
            <p className="summary-value">{formatCurrency(totals.totalBills > 0 ? totals.totalSales / totals.totalBills : 0)}</p>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.invoice_number}</td>
                  <td>{row.customer_name || 'N/A'}</td>
                  <td>{row.item_count}</td>
                  <td>{formatCurrency(row.subtotal)}</td>
                  <td>{formatCurrency(row.cgst)}</td>
                  <td>{formatCurrency(row.sgst)}</td>
                  <td className="total-column">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGSTReport = () => {
    if (!reportData) return null;

    const { data, totals } = reportData;

    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-card">
            <h3>Total CGST</h3>
            <p className="summary-value">{formatCurrency(totals.totalCGST)}</p>
          </div>
          <div className="summary-card">
            <h3>Total SGST</h3>
            <p className="summary-value">{formatCurrency(totals.totalSGST)}</p>
          </div>
          <div className="summary-card">
            <h3>Total GST</h3>
            <p className="summary-value">{formatCurrency(totals.totalGST)}</p>
          </div>
          <div className="summary-card">
            <h3>Total Subtotal</h3>
            <p className="summary-value">{formatCurrency(totals.totalSubtotal)}</p>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Subtotal</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.invoice_number}</td>
                  <td>{row.customer_name || 'N/A'}</td>
                  <td>{formatCurrency(row.subtotal)}</td>
                  <td>{formatCurrency(row.cgst)}</td>
                  <td>{formatCurrency(row.sgst)}</td>
                  <td className="total-column">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInventoryReport = () => {
    if (!reportData) return null;

    const { data, totals } = reportData;

    return (
      <div className="report-content">
        <div className="report-summary">
          <div className="summary-card">
            <h3>Total Items</h3>
            <p className="summary-value">{totals.totalItems}</p>
          </div>
          <div className="summary-card">
            <h3>Total Quantity</h3>
            <p className="summary-value">{totals.totalQuantity}</p>
          </div>
          <div className="summary-card">
            <h3>Total Value</h3>
            <p className="summary-value">{formatCurrency(totals.totalValue)}</p>
          </div>
          <div className="summary-card">
            <h3>Low Stock Items</h3>
            <p className="summary-value low-stock">{totals.lowStockItems}</p>
          </div>
        </div>

        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className={row.stock_status === 'Low Stock' ? 'low-stock-row' : ''}>
                  <td>{row.name}</td>
                  <td>{row.category || 'N/A'}</td>
                  <td>{row.unit}</td>
                  <td>{row.quantity}</td>
                  <td>{formatCurrency(row.rate)}</td>
                  <td>{formatCurrency(row.total_value)}</td>
                  <td>
                    <span className={`stock-status ${row.stock_status === 'Low Stock' ? 'low-stock' : 'available'}`}>
                      {row.stock_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <section className="reports-section">
      <div className="reports-header">
        <h2>Reports</h2>
        <p>Generate and view business reports</p>
      </div>

      <div className="report-controls">
        <div className="report-type-selector">
          <label>Report Type:</label>
          <select value={activeReport} onChange={(e) => setActiveReport(e.target.value)}>
            <option value="sales">Sales Report</option>
            <option value="gst">GST Report</option>
            <option value="inventory">Inventory Report</option>
          </select>
        </div>

        {activeReport !== 'inventory' && (
          <div className="date-range-selector">
            <label>From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
            <label>To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>
        )}

        <button className="primary generate-btn" onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {reportData && (
        <div className="report-container">
          <div className="report-header-actions">
            <h3>
              {activeReport === 'sales' && 'Sales Report'}
              {activeReport === 'gst' && 'GST Report'}
              {activeReport === 'inventory' && 'Inventory Report'}
              {activeReport !== 'inventory' && ` (${formatDate(startDate)} - ${formatDate(endDate)})`}
            </h3>
            <button className="download-pdf-btn" onClick={downloadPDF}>
              Download PDF
            </button>
          </div>

          {activeReport === 'sales' && renderSalesReport()}
          {activeReport === 'gst' && renderGSTReport()}
          {activeReport === 'inventory' && renderInventoryReport()}
        </div>
      )}
    </section>
  );
});
