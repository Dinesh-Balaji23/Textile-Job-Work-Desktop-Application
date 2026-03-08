export const TAB_DEFINITIONS = [
  { key: 'company', label: 'Company Setup' },
  { key: 'inventory', label: 'Inventory Management' },
  { key: 'users', label: 'User Management' },
  { key: 'gst', label: 'GST Configuration' },
  { key: 'reports', label: 'Reporting' }
];

export const emptyCompany = { name: '', gstin: '', address: '', phone: '' };
export const emptyUser = { name: '', email: '', role: 'user', password: '' };
export const emptyItem = { name: '', category: '', unit: 'Nos', quantity: '', rate: '' };

export const units = ['Nos', 'Mtrs', 'Kgs'];
export const userRoles = ['admin', 'user'];
