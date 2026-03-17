// Razorpay Configuration for Desktop Application
export const RAZORPAY_CONFIG = {
  // Use test keys for development - replace with production keys in production
  KEY_ID: 'rzp_test_SSLTswmM3QolqX',
  KEY_SECRET: '7jRt1mIWAaCqBxgKO0QlENbv',
  
  // Payment options
  CURRENCY: 'INR',
  
  // Theme configuration
  THEME: {
    color: '#3399cc',
    backdrop_color: '#ffffff'
  },
  
  // Modal configuration
  MODAL: {
    escape: false,
    handleback: true,
    confirm_close: true,
    animation: 'slideFromBottom',
    persist: 'none'
  },
  
  // Test mode configuration
  TEST_MODE: true,
  TEST_CUSTOMER: {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '9999999999'
  }
};

// Function to load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Function to open Razorpay checkout
export const openRazorpayCheckout = (options) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
  return razorpay;
};
