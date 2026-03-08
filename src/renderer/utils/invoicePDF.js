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
  
  // Header - Company Details
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(company?.name || 'Your Company', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(company?.address || 'Company Address', 20, 30);
  doc.text(`Phone: ${company?.phone || 'N/A'}`, 20, 36);
  doc.text(`GSTIN: ${company?.gstin || 'N/A'}`, 20, 42);
  
  // Invoice Details - Right Side
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, 150, 30);
  doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 150, 36);
  
  // Customer Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(customer?.name || 'N/A', 20, 70);
  doc.text(customer?.address || 'N/A', 20, 76);
  doc.text(`GSTIN: ${customer?.gstin || 'N/A'}`, 20, 82);
  doc.text(`${customer?.state || 'N/A'} (${customer?.state_code || 'N/A'})`, 20, 88);
  
  // Table Headers
  let yPosition = 110;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 20, yPosition);
  doc.text('Quantity', 80, yPosition);
  doc.text('Rate', 120, yPosition);
  doc.text('Amount', 160, yPosition);
  
  // Line under headers
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  
  // Table Items
  yPosition += 10;
  doc.setFont('helvetica', 'normal');
  
  items.forEach((item) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(item.item_name || 'N/A', 20, yPosition);
    doc.text(item.quantity.toString(), 80, yPosition);
    doc.text(`Rs.${item.rate.toFixed(2)}`, 120, yPosition);
    doc.text(`Rs.${item.amount.toFixed(2)}`, 160, yPosition);
    
    yPosition += 8;
  });
  
  // Summary Section
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, 170, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`CGST (${calculateGSTPercentage(invoice.subtotal, invoice.cgst)}%):`, 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs.${invoice.cgst || 0}`, 170, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`SGST (${calculateGSTPercentage(invoice.subtotal, invoice.sgst)}%):`, 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs.${invoice.sgst || 0}`, 170, yPosition);
  
  yPosition += 8;
  doc.line(140, yPosition, 190, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rs.${invoice.total.toFixed(2)}`, 170, yPosition);
  
  // Footer
  yPosition = 280;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated invoice', 105, yPosition, { align: 'center' });
  
  return doc;
}

export function downloadInvoicePDF(invoice, company, customer, items) {
  const doc = generateInvoicePDF(invoice, company, customer, items);
  
  // Generate filename
  const filename = `Invoice_${invoice.invoice_number}_${new Date(invoice.invoice_date).toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(filename);
}
