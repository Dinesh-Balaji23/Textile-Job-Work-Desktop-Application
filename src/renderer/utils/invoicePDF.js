import { jsPDF } from 'jspdf';

export function generateInvoicePDF(invoice, company, customer, items) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Calculate GST percentage from amounts
  function calculateGSTPercentage(amount, gstAmount) {
    if (!amount || amount === 0) return 0;
    if (!gstAmount || gstAmount === 0) return 0;
    return ((gstAmount / amount) * 100).toFixed(1);
  }
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let pageNumber = 1;

  // Helper function to add page with footer
  function addPageWithFooter() {
    doc.addPage();
    pageNumber++;
    yPosition = 20;
  }

  // Footer function
  function addFooter() {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, 285, { align: 'center' });
    doc.text('This is a computer-generated invoice', 20, 285);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);
  }

  // Banner Background (Dark Green)
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Header Text - Bright White
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}  |  Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, pageWidth / 2, 32, { align: 'center' });

  // Company and Customer Container (Side by Side)
  let yPosition = 50;

  // Left side - Company
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(220, 224, 230);
  doc.rect(20, yPosition - 5, 80, 35, 'FD'); // Box behind company
  
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(company?.name || 'Your Company', 25, yPosition + 2);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 139, 34);
  doc.text(company?.address || 'Company Address', 25, yPosition + 8);
  doc.text(`Phone: ${company?.phone || 'N/A'}`, 25, yPosition + 14);
  doc.text(`GSTIN: ${company?.gstin || 'N/A'}`, 25, yPosition + 20);

  // Right side - Customer Info
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(220, 224, 230);
  doc.rect(110, yPosition - 5, 80, 35, 'FD'); // Box behind customer

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 115, yPosition + 2);
  
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text(customer?.name || 'N/A', 115, yPosition + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 139, 34);
  doc.text(customer?.address || 'N/A', 115, yPosition + 14);
  doc.text(`GSTIN: ${customer?.gstin || 'N/A'}`, 115, yPosition + 20);
  doc.text(`${customer?.state || 'N/A'} (${customer?.state_code || 'N/A'})`, 115, yPosition + 26);

  yPosition += 45;

  // Table Headers
  const headerHeight = 9;
  doc.setFillColor(46, 125, 50);
  doc.rect(18, yPosition - 6, 174, headerHeight, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Item Description', 20, yPosition);
  doc.text('Quantity', 100, yPosition);
  doc.text('Rate', 130, yPosition);
  doc.text('Amount', 160, yPosition);
  
  yPosition += headerHeight;

  // Table Items
  doc.setFontSize(9);
  
  items.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > 230) {
      addFooter();
      addPageWithFooter();
      
      // Repeat Header on new page
      doc.setFillColor(46, 125, 50);
      doc.rect(18, yPosition - 6, 174, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Item Description', 20, yPosition);
      doc.text('Quantity', 100, yPosition);
      doc.text('Rate', 130, yPosition);
      doc.text('Amount', 160, yPosition);
      yPosition += headerHeight;
    }
    
    // Zebra Striping
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(18, yPosition - 6, 174, 8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 139, 34);
    
    doc.text(String(item.item_name || 'N/A').substring(0, 40), 20, yPosition);
    doc.text(String(item.quantity).substring(0, 15), 100, yPosition);
    doc.text(`Rs. ${item.rate.toFixed(2)}`, 130, yPosition);
    doc.text(`Rs. ${item.amount.toFixed(2)}`, 160, yPosition);
    
    yPosition += 8;
  });
  
  // Table bottom border
  doc.setDrawColor(46, 125, 50);
  doc.setLineWidth(0.5);
  doc.line(18, yPosition - 6, 192, yPosition - 6);

  // Summary Section
  yPosition += 10;
  
  // Shaded Box for Totals
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(220, 224, 230);
  doc.rect(110, yPosition - 5, 80, 42, 'FD'); 
  
  doc.setTextColor(34, 139, 34);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 115, yPosition + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, 160, yPosition + 2);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`CGST (${calculateGSTPercentage(invoice.subtotal, invoice.cgst)}%):`, 115, yPosition + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs. ${invoice.cgst || 0}`, 160, yPosition + 2);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`SGST (${calculateGSTPercentage(invoice.subtotal, invoice.sgst)}%):`, 115, yPosition + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs. ${invoice.sgst || 0}`, 160, yPosition + 2);
  
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(115, yPosition - 4, 185, yPosition - 4);
  
  doc.setFontSize(12);
  doc.setTextColor(34, 139, 34);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 115, yPosition + 2);
  doc.text(`Rs. ${invoice.total.toFixed(2)}`, 160, yPosition + 2);
  
  // Apply footer to the final page
  addFooter();

  return doc;
}

export function downloadInvoicePDF(invoice, company, customer, items) {
  const doc = generateInvoicePDF(invoice, company, customer, items);
  
  // Generate filename
  const filename = `Invoice_${invoice.invoice_number}_${new Date(invoice.invoice_date).toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(filename);
}
