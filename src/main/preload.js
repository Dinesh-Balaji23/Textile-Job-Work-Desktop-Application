const { contextBridge, ipcRenderer } = require('electron');

const channels = {
  login: 'auth:login',
  getCompany: 'db:getCompany',
  saveCompany: 'db:saveCompany',
  listCustomers: 'db:listCustomers',
  createCustomer: 'db:createCustomer',
  updateCustomer: 'db:updateCustomer',
  deleteCustomer: 'db:deleteCustomer',
  listItems: 'db:listItems',
  createItem: 'db:createItem',
  updateItem: 'db:updateItem',
  adjustItemQuantity: 'db:adjustItemQuantity',
  listInvoices: 'db:listInvoices',
  getInvoiceDetails: 'db:getInvoiceDetails',
  createInvoice: 'db:createInvoice',
  getNextInvoiceNumber: 'db:getNextInvoiceNumber'
};

contextBridge.exposeInMainWorld('api', {
  login: (credentials) => ipcRenderer.invoke(channels.login, credentials),
  getCompany: () => ipcRenderer.invoke(channels.getCompany),
  saveCompany: (payload) => ipcRenderer.invoke(channels.saveCompany, payload),
  listCustomers: () => ipcRenderer.invoke(channels.listCustomers),
  createCustomer: (payload) => ipcRenderer.invoke(channels.createCustomer, payload),
  updateCustomer: (payload) => ipcRenderer.invoke(channels.updateCustomer, payload),
  deleteCustomer: (id) => ipcRenderer.invoke(channels.deleteCustomer, id),
  listItems: () => ipcRenderer.invoke(channels.listItems),
  createItem: (payload) => ipcRenderer.invoke(channels.createItem, payload),
  updateItem: (payload) => ipcRenderer.invoke(channels.updateItem, payload),
  adjustItemQuantity: (payload) => ipcRenderer.invoke(channels.adjustItemQuantity, payload),
  listInvoices: () => ipcRenderer.invoke(channels.listInvoices),
  getInvoiceDetails: (id) => ipcRenderer.invoke(channels.getInvoiceDetails, id),
  createInvoice: (payload) => ipcRenderer.invoke(channels.createInvoice, payload),
  getNextInvoiceNumber: () => ipcRenderer.invoke(channels.getNextInvoiceNumber)
});
