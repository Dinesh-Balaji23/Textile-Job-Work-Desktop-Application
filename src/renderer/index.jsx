import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { AppHeader } from './pos/components/AppHeader';
import { TabBar } from './pos/components/TabBar';
import { ProfileSection } from './pos/components/ProfileSection';
import { CustomersSection } from './pos/components/CustomersSection';
import { BillingSection } from './pos/components/BillingSection';

const InvoicesSection = React.lazy(() => import('./pos/components/InvoicesSection').then(module => ({ default: module.InvoicesSection })));
import { TAB_DEFINITIONS, emptyCustomer } from './pos/constants';
import { useStatusMessage } from './pos/hooks/useStatusMessage';

import { AppHeader as AdminAppHeader } from './admin/components/AppHeader';
import { TabBar as AdminTabBar } from './admin/components/TabBar';
import { CompanySection } from './admin/components/CompanySection';
import { InventorySection } from './admin/components/InventorySection';
import { UserManagementSection } from './admin/components/UserManagementSection';
import { GSTConfigurationSection } from './admin/components/GSTConfigurationSection';

const ReportsSection = React.lazy(() => import('./admin/components/ReportsSection').then(module => ({ default: module.ReportsSection })));
import { TAB_DEFINITIONS as ADMIN_TAB_DEFINITIONS, emptyCompany, emptyItem, units } from './admin/constants';
import { useStatusMessage as useAdminStatusMessage } from './admin/hooks/useStatusMessage';

function LoginScreen({ onLogin, company }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useStatusMessage();
  const companyName = company?.name?.trim() || 'Textile Prime';
  const companySubtitle = company?.gstin ? `GSTIN: ${company.gstin}` : 'Textile Job Work Suite';
  const companyTagline = company?.address?.trim() || 'Inventory • Billing • GST Compliance';

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const user = await window.api.login({ name, password });
      if (!user) {
        setStatus({ type: 'error', text: 'Invalid credentials' });
        return;
      }
      onLogin(user);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Login failed' });
    }
  }

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-brand">
          <div className="logo-circle large">{companyName.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="subtitle">{companySubtitle}</p>
            <h1>{companyName}</h1>
            <p className="tagline">{companyTagline}</p>
          </div>
        </div>
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <label>
            Username
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button type="submit">Login</button>
          {status && <div className={`status ${status.type}`}>{status.text}</div>}
        </form>
      </div>
    </div>
  );
}

function PosApp({ onLogout, user, initialCompany, onCompanyChange }) {
  const api = window.api;
  const [activeTab, setActiveTab] = useState('billing');
  const [status, setStatus] = useStatusMessage();

  const [customers, setCustomers] = useState([]);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  const [items, setItems] = useState([]);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceCustomerId, setInvoiceCustomerId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);

  useEffect(() => {
    refreshAll();
  }, []);

  const [gstSettings, setGSTSettings] = useState({
  cgst_percent: 2.5,
  sgst_percent: 2.5,
  enabled: true
});

const invoiceSummary = useMemo(() => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Only apply GST if enabled
    let cgst = 0;
    let sgst = 0;
    
    if (gstSettings.enabled) {
      cgst = +(subtotal * (gstSettings.cgst_percent / 100)).toFixed(2);
      sgst = +(subtotal * (gstSettings.sgst_percent / 100)).toFixed(2);
    }
    
    const total = +(subtotal + cgst + sgst).toFixed(2);

    return {
      subtotal,
      cgst,
      sgst,
      total,
      cgstRate: gstSettings.cgst_percent,
      sgstRate: gstSettings.sgst_percent
    };
  }, [invoiceItems, gstSettings]);

  async function refreshAll() {
    try {
      const [customerList, itemList, invoiceList, upcomingNo] = await Promise.all([
        api.listCustomers(),
        api.listItems(),
        api.listInvoices(),
        api.getNextInvoiceNumber()
      ]);

      const customersData = customerList || [];
      setCustomers(customersData);
      setItems(itemList || []);
      setInvoices(invoiceList || []);
      setNextInvoiceNumber(upcomingNo || 1);

      // Load GST settings
      try {
        const settings = await window.api.getGSTSettings();
        if (settings) {
          setGSTSettings({
            cgst_percent: settings.cgst_percent || 2.5,
            sgst_percent: settings.sgst_percent || 2.5,
            enabled: settings.enabled === 1 || settings.enabled === true
          });
        }
      } catch (error) {
        console.error('Failed to load GST settings:', error);
      }

      if (!invoiceCustomerId && customersData.length) {
        setInvoiceCustomerId(customersData[0].id.toString());
      }
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to load data' });
    }
  }

  const updateCustomerField = (field, value) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  async function refreshCustomers() {
    const list = await api.listCustomers();
    setCustomers(list || []);
  }

  function resetCustomerForm() {
    setCustomerForm(emptyCustomer);
    setEditingCustomerId(null);
  }

  async function handleCustomerSubmit(event) {
    event.preventDefault();
    try {
      if (editingCustomerId) {
        await api.updateCustomer({ ...customerForm, id: editingCustomerId });
        setStatus({ type: 'success', text: 'Customer updated' });
      } else {
        await api.createCustomer(customerForm);
        setStatus({ type: 'success', text: 'Customer added' });
      }
      await refreshCustomers();
      resetCustomerForm();
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to save customer' });
    }
  }

  function handleCustomerEdit(customer) {
    setCustomerForm({
      name: customer.name || '',
      address: customer.address || '',
      gstin: customer.gstin || '',
      state: customer.state || '',
      state_code: customer.state_code || ''
    });
    setEditingCustomerId(customer.id);
  }

  async function handleCustomerDelete(id) {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.deleteCustomer(id);
      await refreshCustomers();
      setStatus({ type: 'success', text: 'Customer deleted' });
      if (editingCustomerId === id) {
        resetCustomerForm();
      }
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to delete customer' });
    }
  }

  async function refreshItems() {
    const list = await api.listItems();
    setItems(list || []);
  }

  function updateInvoiceItem(id, updates) {
    setInvoiceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  function addInvoiceItem() {
    setInvoiceItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        item_id: '',
        description: '',
        quantity: '',
        rate: '',
        amount: 0
      }
    ]);
  }

  function removeInvoiceItem(id) {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleInvoiceItemChange(rowId, field, value) {
    const selectedItem = items.find((i) => i.id.toString() === value || i.id === value);

    if (field === 'item_id') {
      updateInvoiceItem(rowId, {
        item_id: value,
        rate: selectedItem ? selectedItem.rate : '',
        quantity: '',
        amount: 0
      });
      return;
    }

    setInvoiceItems((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const updated = { ...row, [field]: value };
        const qty = parseFloat(updated.quantity) || 0;
        const rate = parseFloat(updated.rate) || 0;
        return { ...updated, amount: +(qty * rate).toFixed(2) };
      })
    );
  }


  async function handleInvoiceSave(event) {
    event.preventDefault();
    if (!invoiceCustomerId) {
      setStatus({ type: 'error', text: 'Select a customer before invoicing' });
      return;
    }
    if (!invoiceItems.length) {
      setStatus({ type: 'error', text: 'Add at least one line item' });
      return;
    }

    try {
      const payload = {
        invoice_date: invoiceDate,
        customer_id: Number(invoiceCustomerId),
        items: invoiceItems.map((row) => ({
          item_id: Number(row.item_id),
          description: row.description || '',
          quantity: parseFloat(row.quantity) || 0,
          rate: parseFloat(row.rate) || 0,
          amount: parseFloat(row.amount) || 0
        }))
      };

      await api.createInvoice(payload);
      setStatus({ type: 'success', text: 'Invoice saved' });
      setInvoiceItems([]);
      setInvoiceNotes('');
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      const [updatedInvoices, updatedItems, upcomingNo] = await Promise.all([
        api.listInvoices(),
        api.listItems(),
        api.getNextInvoiceNumber()
      ]);
      setInvoices(updatedInvoices || []);
      setItems(updatedItems || []);
      setNextInvoiceNumber(upcomingNo || 1);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to save invoice' });
    }
  }

  async function handleInvoiceSelect(invoice) {
    setSelectedInvoice(invoice);
    try {
      const details = await api.getInvoiceDetails(invoice.id);
      setInvoiceDetails(details);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to load invoice details' });
    }
  }

  return (
    <div className="app-shell">
      <AppHeader onLogout={onLogout} user={user} company={initialCompany} items={items} />

      <TabBar tabs={TAB_DEFINITIONS} activeTab={activeTab} onChange={setActiveTab} />

      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      <main>
        <Suspense fallback={<div className="status info">Loading module...</div>}>
          {activeTab === 'profile' && (
            <ProfileSection 
              user={user} 
              onUserUpdate={(updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }))}
            />
          )}

        {activeTab === 'customers' && (
          <CustomersSection
            form={customerForm}
            editingCustomerId={editingCustomerId}
            customers={customers}
            onFieldChange={updateCustomerField}
            onSubmit={handleCustomerSubmit}
            onEdit={handleCustomerEdit}
            onDelete={handleCustomerDelete}
            onCancelEdit={resetCustomerForm}
          />
        )}

        {activeTab === 'billing' && (
          <BillingSection
            nextInvoiceNumber={nextInvoiceNumber}
            invoiceDate={invoiceDate}
            invoiceCustomerId={invoiceCustomerId}
            customers={customers}
            invoiceItems={invoiceItems}
            invoiceNotes={invoiceNotes}
            invoiceSummary={invoiceSummary}
            items={items}
            gstSettings={gstSettings}
            onDateChange={setInvoiceDate}
            onCustomerChange={setInvoiceCustomerId}
            onAddItem={addInvoiceItem}
            onItemChange={handleInvoiceItemChange}
            onRemoveItem={removeInvoiceItem}
            onNotesChange={setInvoiceNotes}
            onSubmit={handleInvoiceSave}
          />
        )}

          {activeTab === 'invoices' && (
            <InvoicesSection
              invoices={invoices}
              selectedInvoice={selectedInvoice}
              invoiceDetails={invoiceDetails}
              company={initialCompany}
              onSelect={handleInvoiceSelect}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}

function AdminApp({ onLogout, user, initialCompany, onCompanyChange }) {
  const api = window.api;
  const [activeTab, setActiveTab] = useState('company');
  const [status, setStatus] = useAdminStatusMessage();

  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [company, setCompany] = useState(initialCompany || null);
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (initialCompany) {
      setCompany(initialCompany);
      setCompanyForm({
        name: initialCompany.name || '',
        gstin: initialCompany.gstin || '',
        address: initialCompany.address || '',
        phone: initialCompany.phone || ''
      });
    }
  }, [initialCompany]);

  async function refreshAll() {
    try {
      const [companyData, itemList] = await Promise.all([
        api.getCompany(),
        api.listItems()
      ]);

      if (companyData) {
        setCompany(companyData);
        setCompanyForm({
          name: companyData.name || '',
          gstin: companyData.gstin || '',
          address: companyData.address || '',
          phone: companyData.phone || ''
        });
        onCompanyChange?.(companyData);
      }

      setItems(itemList || []);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to load data' });
    }
  }

  const updateCompanyField = (field, value) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItemField = (field, value) => {
    setItemForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleCompanySave(event) {
    event.preventDefault();
    try {
      const updated = await api.saveCompany(companyForm);
      setCompany(updated);
      onCompanyChange?.(updated);
      setStatus({ type: 'success', text: 'Company details saved' });
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to save company' });
    }
  }

  async function refreshItems() {
    const list = await api.listItems();
    setItems(list || []);
  }

  function resetItemForm() {
    setItemForm(emptyItem);
    setEditingItemId(null);
  }

  async function handleItemSubmit(event) {
    event.preventDefault();
    if (!itemForm.name.trim()) {
      setStatus({ type: 'error', text: 'Item name is required' });
      return;
    }
    const payload = {
      ...itemForm,
      quantity: parseFloat(itemForm.quantity || 0),
      rate: parseFloat(itemForm.rate || 0)
    };
    try {
      if (editingItemId) {
        await api.updateItem({ ...payload, id: editingItemId });
        setStatus({ type: 'success', text: 'Item updated' });
      } else {
        await api.createItem(payload);
        setStatus({ type: 'success', text: 'Item added' });
      }
      await refreshItems();
      resetItemForm();
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to save item' });
    }
  }

  const handleItemDelete = async (id) => {
    try {
      await window.api.deleteItem(id);
      setStatus({ type: 'success', text: 'Item deleted successfully' });
      await refreshItems();
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to delete item' });
    }
  };

  function handleItemEdit(item) {
    setItemForm({
      name: item.name || '',
      category: item.category || '',
      unit: item.unit || 'Nos',
      quantity: item.quantity?.toString() ?? '',
      rate: item.rate?.toString() ?? ''
    });
    setEditingItemId(item.id);
  }

  return (
    <div className="app-shell">
      <AdminAppHeader onLogout={onLogout} user={user} company={company} items={items} />

      <AdminTabBar tabs={ADMIN_TAB_DEFINITIONS} activeTab={activeTab} onChange={setActiveTab} />

      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      <main>
        <Suspense fallback={<div className="status info">Loading module...</div>}>
          {activeTab === 'company' && (
            <CompanySection
              form={companyForm}
              onFieldChange={updateCompanyField}
              onSubmit={handleCompanySave}
            />
          )}

        {activeTab === 'inventory' && (
          <InventorySection
            form={itemForm}
            editingItemId={editingItemId}
            units={units}
            items={items}
            onFieldChange={updateItemField}
            onSubmit={handleItemSubmit}
            onEdit={handleItemEdit}
            onCancelEdit={resetItemForm}
            onRefresh={refreshItems}
            onDelete={handleItemDelete} // Add delete callback
          />
        )}

        {activeTab === 'users' && <UserManagementSection />}

          {activeTab === 'gst' && <GSTConfigurationSection />}

          {activeTab === 'reports' && <ReportsSection />}
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    window.api
      .getCompany()
      .then((data) => setCompany(data))
      .catch(() => {});
  }, []);

  if (!user) {
    return <LoginScreen onLogin={setUser} company={company} />;
  }

  if (user.role === 'admin') {
    return (
      <AdminApp
        onLogout={() => setUser(null)}
        user={user}
        initialCompany={company}
        onCompanyChange={setCompany}
      />
    );
  }

  return (
    <PosApp
      onLogout={() => setUser(null)}
      user={user}
      initialCompany={company}
      onCompanyChange={setCompany}
    />
  );
}

const container = document.getElementById('root');
createRoot(container).render(<App />);
