const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const {
  initializeDatabase,
  authenticateUser,
  getCompany,
  saveCompany,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listItems,
  createItem,
  updateItem,
  adjustItemQuantity,
  listInvoices,
  createInvoice,
  getInvoiceDetails,
  getNextInvoiceNumber
} = require('./database');

const isDev = process.env.NODE_ENV === 'development';
const databaseFile = path.join(app.getPath('userData'), 'textile-pos.db');
const rendererEntry = path.join(__dirname, '../../dist/renderer/index.html');
const projectDbPath = path.join(__dirname, '../../data/textile-pos.db');
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

  ipcMain.handle('db:getCompany', () => getCompany());
  ipcMain.handle('db:saveCompany', (_, payload) => saveCompany(payload));

  ipcMain.handle('db:listCustomers', () => listCustomers());
  ipcMain.handle('db:createCustomer', (_, payload) => createCustomer(payload));
  ipcMain.handle('db:updateCustomer', (_, payload) => updateCustomer(payload.id, payload));
  ipcMain.handle('db:deleteCustomer', (_, id) => deleteCustomer(id));

  ipcMain.handle('db:listItems', () => listItems());
  ipcMain.handle('db:createItem', (_, payload) => createItem(payload));
  ipcMain.handle('db:updateItem', (_, payload) => updateItem(payload.id, payload));
  ipcMain.handle('db:adjustItemQuantity', (_, payload) => adjustItemQuantity(payload.id, payload.quantity));

  ipcMain.handle('db:listInvoices', () => listInvoices());
  ipcMain.handle('db:getInvoiceDetails', (_, id) => getInvoiceDetails(id));
  ipcMain.handle('db:createInvoice', (_, payload) => createInvoice(payload));
  ipcMain.handle('db:getNextInvoiceNumber', () => getNextInvoiceNumber());
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
