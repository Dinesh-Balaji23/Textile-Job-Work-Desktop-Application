import { RAZORPAY_CONFIG, loadRazorpayScript, openRazorpayCheckout } from './razorpayConfig.js';

export class RazorpayService {
  constructor() {
    this.isLoaded = false;
  }

  // Initialize Razorpay SDK
  async initialize() {
    if (this.isLoaded) return true;
    
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }
    
    this.isLoaded = true;
    return true;
  }

  // Create order options for Razorpay checkout
  async createOrderOptions(orderData, invoiceData) {
    const {
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      invoiceNumber
    } = orderData;

    try {
      // Create order through backend
      const order = await window.electronAPI.invoke('razorpay:createOrder', {
        totalAmount,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        }
      });

      console.log('Razorpay: Order created successfully:', order);

      return {
        key: RAZORPAY_CONFIG.KEY_ID,
        amount: totalAmount * 100, // Convert to paise
        currency: RAZORPAY_CONFIG.CURRENCY,
        name: 'Textile POS',
        description: `Invoice #${invoiceNumber}`,
        order_id: order.id,
        prefill: {
          name: customerName || '',
          email: customerEmail || '',
          contact: customerPhone || ''
        },
        theme: RAZORPAY_CONFIG.THEME,
        modal: RAZORPAY_CONFIG.MODAL,
        handler: (response) => {
          // Handle successful payment
          this.handlePaymentSuccess(response, orderData, invoiceData);
        },
        notes: {
          invoice_number: invoiceNumber,
          customer_name: customerName
        }
      };
    } catch (error) {
      console.error('Razorpay: Order creation failed:', error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  // Process payment for invoice
  async processPayment(invoiceData, customerData) {
    try {
      await this.initialize();
      
      // Debug logging
      console.log('Razorpay: Starting payment processing');
      console.log('Razorpay: Invoice data:', invoiceData);
      console.log('Razorpay: Customer data:', customerData);
      
      // Validate input data
      if (!invoiceData) {
        throw new Error('Invoice data is required');
      }
      
      if (!customerData) {
        throw new Error('Customer data is required');
      }
      
      // Create order data with fallbacks for undefined values
      const orderData = {
        totalAmount: invoiceData.total || 0,
        customerName: customerData.name || 'Test Customer',
        customerEmail: customerData.email || 'test@example.com',
        customerPhone: customerData.phone || '9999999999',
        invoiceNumber: invoiceData.invoice_number || 'INV-000'
      };

      console.log('Razorpay: Order data created:', orderData);

      const options = await this.createOrderOptions(orderData, invoiceData);
      
      console.log('Razorpay: Opening checkout with options:', options);
      
      // Open Razorpay checkout
      return openRazorpayCheckout(options);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  // Handle successful payment
  handlePaymentSuccess(response, orderData, invoiceData) {
    // Emit custom event for payment success
    const event = new CustomEvent('razorpay:payment-success', {
      detail: {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        invoiceData,
        orderData
      }
    });
    document.dispatchEvent(event);
  }

  // Verify payment signature (should be done on backend)
  async verifyPayment(response) {
    try {
      // Call backend to verify the payment signature
      return await window.electronAPI.invoke('razorpay:verifyPayment', response);
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
