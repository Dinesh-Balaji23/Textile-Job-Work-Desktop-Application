export const TAB_DEFINITIONS = [
  { key: 'company', label: 'Company Setup' },
  { key: 'customers', label: 'Customers / Mills' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'billing', label: 'Billing' },
  { key: 'invoices', label: 'Invoices' }
];

export const emptyCompany = { name: '', gstin: '', address: '', phone: '' };
export const emptyCustomer = { name: '', address: '', gstin: '', state: '', state_code: '' };
export const emptyItem = { name: '', category: '', unit: 'Nos', quantity: '', rate: '' };

export const units = ['Nos', 'Mtrs', 'Kgs'];
