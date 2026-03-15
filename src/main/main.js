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
