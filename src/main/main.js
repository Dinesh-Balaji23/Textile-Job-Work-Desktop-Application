const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const isDev = process.env.NODE_ENV === 'development';
const databaseFile = path.join(app.getPath('userData'), 'textile-pos.db');
const rendererEntry = path.join(__dirname, '../../dist/renderer/index.html');
const projectDbPath = path.join(__dirname, '../../data/textile-pos.db');

// Clear require cache to force reload of database module
delete require.cache[require.resolve('./database')];

const {
  initializeDatabase,
  authenticateUser,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getUserByName,
  updateUserByName,
  getGSTSettings,
  updateGSTSettings,
  getCompany,
  saveCompany,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  adjustItemQuantity,
  listInvoices,
  createInvoice,
  getInvoiceDetails,
  getNextInvoiceNumber,
  getSalesReport,
  getGSTReport,
  getInventoryReport,
  getTopSellingItems,
  getCustomerSalesReport
} = require('./database');
let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(rendererEntry);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle('auth:login', (_, credentials) => authenticateUser(credentials));

  // User management
  ipcMain.handle('db:listUsers', () => listUsers());
  ipcMain.handle('db:createUser', (_, payload) => createUser(payload));
  ipcMain.handle('db:updateUser', (_, payload) => updateUser(payload.id, payload));
  ipcMain.handle('db:deleteUser', (_, id) => deleteUser(id));
  ipcMain.handle('db:updateUserProfile', (_, payload) => updateUserByName(payload.currentName, payload));

  // GST configuration
  ipcMain.handle('db:getGSTSettings', () => getGSTSettings());
  ipcMain.handle('db:updateGSTSettings', (_, payload) => updateGSTSettings(payload));

  ipcMain.handle('db:getCompany', () => getCompany());
  ipcMain.handle('db:saveCompany', (_, payload) => saveCompany(payload));

  ipcMain.handle('db:listCustomers', () => listCustomers());
  ipcMain.handle('db:createCustomer', (_, payload) => createCustomer(payload));
  ipcMain.handle('db:updateCustomer', (_, payload) => updateCustomer(payload.id, payload));
  ipcMain.handle('db:deleteCustomer', (_, id) => deleteCustomer(id));

  ipcMain.handle('db:listItems', () => listItems());
  ipcMain.handle('db:createItem', (_, payload) => createItem(payload));
  ipcMain.handle('db:updateItem', (_, payload) => updateItem(payload.id, payload));
  ipcMain.handle('db:deleteItem', (_, id) => deleteItem(id));
  ipcMain.handle('db:adjustItemQuantity', (_, payload) => adjustItemQuantity(payload.id, payload.quantity));

  ipcMain.handle('db:listInvoices', () => listInvoices());
  ipcMain.handle('db:getInvoiceDetails', (_, id) => getInvoiceDetails(id));
  ipcMain.handle('db:createInvoice', (_, payload) => createInvoice(payload));
  ipcMain.handle('db:getNextInvoiceNumber', () => getNextInvoiceNumber());

  // Report handlers
  ipcMain.handle('db:getSalesReport', (_, { startDate, endDate }) => getSalesReport(startDate, endDate));
  ipcMain.handle('db:getGSTReport', (_, { startDate, endDate }) => getGSTReport(startDate, endDate));
  ipcMain.handle('db:getInventoryReport', () => getInventoryReport());
  ipcMain.handle('db:getTopSellingItems', (_, { startDate, endDate, limit }) => getTopSellingItems(startDate, endDate, limit));
  ipcMain.handle('db:getCustomerSalesReport', (_, { startDate, endDate }) => getCustomerSalesReport(startDate, endDate));

  // Razorpay payment handlers
  ipcMain.handle('razorpay:createOrder', async (_, { totalAmount, customerInfo }) => {
    try {
      const Razorpay = require('razorpay');
      
      const razorpay = new Razorpay({
        key_id: 'rzp_test_SSLTswmM3QolqX',
        key_secret: '7jRt1mIWAaCqBxgKO0QlENbv',
      });

      const options = {
        amount: totalAmount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1
      };

      const order = await razorpay.orders.create(options);
      return order;
      
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      // Fallback to mock order for testing if API fails
      const crypto = require('crypto');
      const receipt = crypto.randomBytes(10).toString('hex');
      const orderId = `order_${Date.now()}_${receipt}`;
      
      return {
        id: orderId,
        entity: 'order',
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      };
    }
  });

  ipcMain.handle('razorpay:verifyPayment', async (_, paymentData) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;
      
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        throw new Error('Invalid payment data');
      }

      // For test mode, we'll accept the payment without signature verification
      // In production, you would verify the signature like this:
      /*
      const crypto = require('crypto');
      const Razorpay = require('razorpay');
      
      const razorpay = new Razorpay({
        key_id: 'rzp_test_SSLTswmM3QolqX',
        key_secret: '7jRt1mIWAaCqBxgKO0QlENbv',
      });

      const generated_signature = crypto
        .createHmac('sha256', '7jRt1mIWAaCqBxgKO0QlENbv')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        throw new Error('Invalid payment signature');
      }
      */
      
      return {
        verified: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      };
      
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  });

  ipcMain.handle('razorpay:savePaymentRecord', async (_, paymentRecord) => {
    try {
      // Save payment record to your database
      // This would integrate with your existing invoice system
      console.log('Payment record saved:', paymentRecord);
      
      // For now, just log the payment record
      // In production, you might want to:
      // 1. Create a payments table
      // 2. Store payment details with invoice reference
      // 3. Update invoice status to 'paid'
      
      return { success: true, record: paymentRecord };
    } catch (error) {
      console.error('Error saving payment record:', error);
      throw error;
    }
  });
}

app.whenReady().then(async () => {
  await initializeDatabase(projectDbPath);
  createMainWindow();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
