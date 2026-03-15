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
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageNumber}`, pageWidth - 30, 285);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 285);
  }

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(reportType.toUpperCase() + ' REPORT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Date range
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  if (dateRange) {
    pdf.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, pageWidth / 2, yPosition, { align: 'center' });
  } else {
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  }
  yPosition += 20;

  // Summary
  if (reportData.totals) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUMMARY:', 20, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    Object.entries(reportData.totals).forEach(([key, value]) => {
      if (yPosition > 250) {
        addFooter();
        addPageWithFooter();
      }
      const label = formatLabel(key);
      const formattedValue = formatValue(key, value);
      pdf.text(`${label}: ${formattedValue}`, 30, yPosition);
      yPosition += 8;
    });
    yPosition += 15;
  }

  // Table data
  if (reportData.data && reportData.data.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAILS:', 20, yPosition);
    yPosition += 15;

    // Debug: Log the data structure
    console.log('PDF Report Data:', reportData);
    console.log('Report Type:', reportType);
    console.log('First Row:', reportData.data[0]);

    // Headers with better spacing
    const headers = getTableHeaders(reportType);
    const columnPositions = getColumnPositions(reportType);
    
    // Add headers with proper spacing
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0); // Ensure black text
    console.log('Headers:', headers);
    console.log('Column Positions:', columnPositions);
    headers.forEach((header, index) => {
      console.log(`Drawing header "${header}" at position ${columnPositions[index]}, y=${yPosition}`);
      pdf.text(header, columnPositions[index], yPosition);
    });
    
    // Add line separator under headers
    const headerY = yPosition + 5;
    pdf.setLineWidth(0.5);
    pdf.line(20, headerY, 190, headerY);
    yPosition = headerY + 10;

    // Data rows with proper spacing
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0); // Ensure black text for data too
    reportData.data.forEach((row, rowIndex) => {
      console.log(`Processing row ${rowIndex}:`, row);
      if (yPosition > 250) {
        addFooter();
        addPageWithFooter();
        
        // Repeat headers on new page
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Ensure black text
        headers.forEach((header, index) => {
          pdf.text(header, columnPositions[index], yPosition);
        });
        
        // Add line separator under headers on new page
        const newPageHeaderY = yPosition + 5;
        pdf.setLineWidth(0.5);
        pdf.line(20, newPageHeaderY, 190, newPageHeaderY);
        yPosition = newPageHeaderY + 10;
        pdf.setFont('helvetica', 'normal');
      }
      
      const rowData = formatTableRow(row, reportType);
      console.log(`Formatted row data:`, rowData);
      rowData.forEach((cell, index) => {
        const cellText = String(cell || '').substring(0, 25);
        console.log(`Drawing cell "${cellText}" at position ${columnPositions[index]}, y=${yPosition}`);
        pdf.text(cellText, columnPositions[index], yPosition);
      });
      yPosition += 8;
    });
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
