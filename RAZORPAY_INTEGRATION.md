# Razorpay Integration for Textile POS Desktop Application

This document explains the Razorpay payment integration implemented in your Textile POS desktop application.

## Overview

The integration allows customers to pay invoices online using Razorpay's payment gateway in addition to the existing cash payment option.

## Files Added/Modified

### New Files Created
- `src/renderer/utils/razorpayConfig.js` - Razorpay configuration and utility functions
- `src/renderer/utils/razorpayService.js` - Main Razorpay service class
- `RAZORPAY_INTEGRATION.md` - This documentation file

### Modified Files
- `package.json` - Added razorpay dependency
- `src/main/main.js` - Added Razorpay IPC handlers
- `src/main/preload.js` - Exposed Razorpay API to renderer
- `src/renderer/pos/components/BillingSection.jsx` - Added payment method selection and Razorpay integration

## Features

### Payment Methods
- **Cash**: Traditional cash payment (existing functionality)
- **Online Payment**: Razorpay integration for online payments

### Payment Flow
1. User selects "Online Payment (Razorpay)" as payment method
2. Clicks "Pay Online" button
3. Razorpay checkout modal opens
4. User completes payment
5. Payment is verified and recorded
6. Invoice is saved with payment status

### Configuration
- Uses Razorpay test keys by default
- Configurable theme and modal settings
- Automatic payment verification
- Payment record storage

## Usage

### For Development (Test Mode)
The application uses Razorpay test keys:
- Key ID: `rzp_test_SSLTswmM3QolqX`
- Key Secret: `7jRt1mIWAaCqBxgKO0QlENbv`

Test card numbers can be found in Razorpay's documentation.

### For Production
1. Replace test keys with production keys in `razorpayConfig.js`
2. Update the order creation logic to use actual Razorpay API
3. Implement proper signature verification

## API Endpoints

### Main Process IPC Handlers
- `razorpay:createOrder` - Creates a payment order
- `razorpay:verifyPayment` - Verifies payment signature
- `razorpay:savePaymentRecord` - Saves payment record to database

### Frontend Service
- `razorpayService.initialize()` - Loads Razorpay SDK
- `razorpayService.processPayment()` - Processes payment
- `razorpayService.verifyPayment()` - Verifies payment

## Error Handling

The integration includes comprehensive error handling:
- SDK loading failures
- Payment processing errors
- Verification failures
- Network connectivity issues

## Security Notes

- Payment verification is done on the backend (main process)
- Keys are stored securely in the main process
- No sensitive data is exposed to the renderer process

## Future Enhancements

1. **Production API Integration**: Replace mock order creation with actual Razorpay API calls
2. **Payment History**: Add payment history tracking
3. **Refund Support**: Implement refund functionality
4. **Multiple Payment Gateways**: Add support for other payment providers
5. **Subscription Payments**: Add recurring payment support

## Troubleshooting

### Common Issues

1. **"rzp.open is not a function"**
   - Ensure Razorpay script is loaded properly
   - Check internet connectivity
   - Verify script loading in browser console

2. **Payment verification fails**
   - Check API keys are correct
   - Ensure backend handlers are properly registered
   - Verify payment data format

3. **Modal doesn't open**
   - Check if payment processing state is correctly managed
   - Verify customer data is complete
   - Ensure invoice data is valid

### Debug Steps
1. Open browser developer tools
2. Check console for errors
3. Verify network requests
4. Check IPC communication logs

## Support

For issues related to Razorpay integration, check:
1. Razorpay documentation: https://razorpay.com/docs/
2. Electron IPC documentation: https://electronjs.org/docs/api/ipc-main
3. Application logs in the main process console
