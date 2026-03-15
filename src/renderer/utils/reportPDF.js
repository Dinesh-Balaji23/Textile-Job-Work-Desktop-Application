import { jsPDF } from 'jspdf';

export function generateReportPDF(reportType, reportData, dateRange) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;
  let pageNumber = 1;

  // Helper function to add page with footer
  function addPageWithFooter() {
    pdf.addPage();
    pageNumber++;
    yPosition = 20;
  }

  // Helper function to add footer
  function addFooter() {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${pageNumber}`, pageWidth / 2, 285, { align: 'center' });
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 285);
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(20, 280, 190, 280);
  }

  // Banner background
  pdf.setFillColor(52, 73, 94); // Dark blue header banner
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  const cleanTitle = reportType.toLowerCase().replace(' report', '').toUpperCase();
  pdf.text(`${cleanTitle} REPORT`, pageWidth / 2, 22, { align: 'center' });

  // Date range
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  if (dateRange) {
    pdf.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, pageWidth / 2, 32, { align: 'center' });
  } else {
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });
  }
  yPosition = 50;

  // Summary
  if (reportData.totals) {
    pdf.setFillColor(245, 247, 250);
    pdf.setDrawColor(220, 224, 230);
    const summaryHeight = (Object.keys(reportData.totals).length * 8) + 12;
    pdf.rect(20, yPosition - 5, 170, summaryHeight, 'FD');

    pdf.setFontSize(12);
    pdf.setTextColor(44, 62, 80);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUMMARY', 25, yPosition + 2);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(52, 73, 94);
    Object.entries(reportData.totals).forEach(([key, value]) => {
      if (yPosition > 250) {
        addFooter();
        addPageWithFooter();
      }
      const label = formatLabel(key);
      const formattedValue = formatValue(key, value);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, 30, yPosition + 2);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${formattedValue}`, 80, yPosition + 2);
      yPosition += 8;
    });
    yPosition += 15;
  }

  // Table data
  if (reportData.data && reportData.data.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(52, 73, 94);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAILS', 20, yPosition);
    yPosition += 10;

    const headers = getTableHeaders(reportType);
    const columnPositions = getColumnPositions(reportType);
    
    // Header Row Background
    const headerHeight = 9;
    pdf.setFillColor(65, 84, 104);
    pdf.rect(18, yPosition - 6, 174, headerHeight, 'F');

    // Headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255); 
    headers.forEach((header, index) => {
      pdf.text(header, columnPositions[index], yPosition);
    });
    
    yPosition += headerHeight;

    // Data rows
    pdf.setFontSize(9);
    reportData.data.forEach((row, rowIndex) => {
      if (yPosition > 270) {
        addFooter();
        addPageWithFooter();
        
        // Header on new page
        pdf.setFillColor(65, 84, 104);
        pdf.rect(18, yPosition - 6, 174, headerHeight, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        headers.forEach((header, index) => {
          pdf.text(header, columnPositions[index], yPosition);
        });
        yPosition += headerHeight;
      }
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(44, 62, 80);
      
      // Zebra striping
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(18, yPosition - 6, 174, 8, 'F');
      }

      const rowData = formatTableRow(row, reportType);
      rowData.forEach((cell, index) => {
        const cellText = String(cell || '').substring(0, 25);
        pdf.text(cellText, columnPositions[index], yPosition);
      });
      yPosition += 8;
    });

    // Final table bottom line
    pdf.setDrawColor(65, 84, 104);
    pdf.setLineWidth(0.5);
    pdf.line(18, yPosition - 6, 192, yPosition - 6);
  }

  // Add footer to last page
  addFooter();

  return pdf;
}

export function downloadReportPDF(reportType, reportData, dateRange) {
  try {
    const pdf = generateReportPDF(reportType, reportData, dateRange);
    const fileName = `${reportType.toLowerCase().replace(/\s+/g, '_')}_report_${dateRange ? dateRange.startDate.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating report PDF:', error);
    throw error;
  }
}

function formatDate(dateString) {
  try {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

function formatLabel(key) {
  const labels = {
    totalSales: 'Total Sales',
    totalCGST: 'Total CGST',
    totalSGST: 'Total SGST',
    totalGST: 'Total GST',
    totalSubtotal: 'Total Subtotal',
    totalBills: 'Total Bills',
    totalItems: 'Total Items',
    totalInvoices: 'Total Invoices',
    totalQuantity: 'Total Quantity',
    totalValue: 'Total Value',
    lowStockItems: 'Low Stock Items'
  };
  return labels[key] || key;
}

function formatValue(key, value) {
  if (typeof value === 'number') {
    // Currency fields should show Rs. prefix
    if (key.toLowerCase().includes('sales') || 
        key.toLowerCase().includes('total') && 
        (key.toLowerCase().includes('cgst') || key.toLowerCase().includes('sgst') || key.toLowerCase().includes('gst') || key.toLowerCase().includes('subtotal') || key.toLowerCase().includes('value'))) {
      return `Rs. ${value.toFixed(2)}`;
    }
    // Count fields should show as plain numbers
    return value.toString();
  }
  return value;
}

function getTableHeaders(reportType) {
  // Convert "Sales Report" to "sales", "GST Report" to "gst", etc.
  const normalizedType = reportType.toLowerCase().replace(' report', '');
  const headers = {
    sales: ['Date', 'Invoice #', 'Customer', 'Items', 'Subtotal', 'CGST', 'SGST', 'Total'],
    gst: ['Date', 'Invoice #', 'Customer', 'Subtotal', 'CGST', 'SGST', 'Total'],
    inventory: ['Item Name', 'Category', 'Unit', 'Quantity', 'Rate', 'Total Value', 'Status']
  };
  return headers[normalizedType] || [];
}

function getColumnPositions(reportType) {
  // Convert "Sales Report" to "sales", "GST Report" to "gst", etc.
  const normalizedType = reportType.toLowerCase().replace(' report', '');
  const positions = {
    sales: [20, 40, 58, 93, 108, 128, 150, 172],
    gst: [20, 42, 62, 104, 128, 150, 172],
    inventory: [20, 55, 80, 100, 120, 145, 172]
  };
  return positions[normalizedType] || [20, 40, 60, 85, 110, 135, 160, 185];
}

function getColumnWidths(reportType) {
  const widths = {
    sales: [25, 25, 40, 30, 25, 25, 25, 25],
    gst: [25, 25, 40, 30, 25, 25, 30],
    inventory: [50, 30, 15, 20, 20, 25, 25]
  };
  return widths[reportType] || [];
}

function formatTableRow(row, reportType) {
  // Convert "Sales Report" to "sales", "GST Report" to "gst", etc.
  const normalizedType = reportType.toLowerCase().replace(' report', '');
  
  switch (normalizedType) {
    case 'sales':
      return [
        row.date || 'N/A',
        String(row.invoice_number || ''),
        String(row.customer_name || 'N/A').substring(0, 20),
        String(row.item_count || '0'),
        `Rs. ${parseFloat(row.subtotal || 0).toFixed(2)}`,
        `Rs. ${parseFloat(row.cgst || 0).toFixed(2)}`,
        `Rs. ${parseFloat(row.sgst || 0).toFixed(2)}`,
        `Rs. ${parseFloat(row.total || 0).toFixed(2)}`
      ];
    
    case 'gst':
      return [
        row.date || 'N/A',
        String(row.invoice_number || ''),
        String(row.customer_name || 'N/A').substring(0, 20),
        `Rs. ${parseFloat(row.subtotal || 0).toFixed(2)}`,
        `Rs. ${parseFloat(row.cgst || 0).toFixed(2)}`,
        `Rs. ${parseFloat(row.sgst || 0).toFixed(2)}`,
        `Rs. ${parseFloat(row.total || 0).toFixed(2)}`
      ];
    
    case 'inventory':
      return [
        String(row.name || '').substring(0, 20),
        String(row.category || 'N/A').substring(0, 15),
        String(row.unit || ''),
        String(row.quantity || '0'),
        `Rs. ${parseFloat(row.rate || 0).toFixed(2)}`,
        `Rs. ${parseFloat(row.total_value || 0).toFixed(2)}`,
        String(row.stock_status || 'N/A')
      ];
    
    default:
      return Object.values(row).map(val => String(val || ''));
  }
}

function formatCurrency(amount) {
  try {
    const num = parseFloat(amount || 0);
    if (isNaN(num)) return 'Rs. 0.00';
    return `Rs. ${num.toFixed(2)}`;
  } catch (error) {
    return 'Rs. 0.00';
  }
}
