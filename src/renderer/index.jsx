import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { AppHeader } from './pos/components/AppHeader';
import { TabBar } from './pos/components/TabBar';
import { CompanySection } from './pos/components/CompanySection';
import { CustomersSection } from './pos/components/CustomersSection';
import { InventorySection } from './pos/components/InventorySection';
import { BillingSection } from './pos/components/BillingSection';
import { InvoicesSection } from './pos/components/InvoicesSection';
import { TAB_DEFINITIONS, emptyCompany, emptyCustomer, emptyItem, units } from './pos/constants';
import { useStatusMessage } from './pos/hooks/useStatusMessage';

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

  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [company, setCompany] = useState(initialCompany || null);
  const [customers, setCustomers] = useState([]);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingItemId, setEditingItemId] = useState(null);

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

  const invoiceSummary = useMemo(() => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const cgst = +(subtotal * 0.025).toFixed(2);
    const sgst = +(subtotal * 0.025).toFixed(2);
    const total = +(subtotal + cgst + sgst).toFixed(2);
    return { subtotal, cgst, sgst, total };
  }, [invoiceItems]);


  async function refreshAll() {
    try {
      const [company, customerList, itemList, invoiceList, upcomingNo] = await Promise.all([
        api.getCompany(),
        api.listCustomers(),
        api.listItems(),
        api.listInvoices(),
        api.getNextInvoiceNumber()
      ]);

      if (company) {
        setCompany(company);
        setCompanyForm({
          name: company.name || '',
          gstin: company.gstin || '',
          address: company.address || '',
          phone: company.phone || ''
        });
        onCompanyChange?.(company);
      }

      const customersData = customerList || [];
      setCustomers(customersData);
      setItems(itemList || []);
      setInvoices(invoiceList || []);
      setNextInvoiceNumber(upcomingNo || 1);

      if (!invoiceCustomerId && customersData.length) {
        setInvoiceCustomerId(customersData[0].id.toString());
      }
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to load data' });
    }
  }

  const updateCompanyField = (field, value) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCustomerField = (field, value) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
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
      <AppHeader onLogout={onLogout} user={user} company={company} />

      <TabBar tabs={TAB_DEFINITIONS} activeTab={activeTab} onChange={setActiveTab} />

      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      <main>
        {activeTab === 'company' && (
          <CompanySection
            form={companyForm}
            onFieldChange={updateCompanyField}
            onSubmit={handleCompanySave}
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
            onSelect={handleInvoiceSelect}
          />
        )}
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
      <div className="app-shell">
        <AppHeader onLogout={() => setUser(null)} user={user} company={company} />
        <div className="placeholder">Admin dashboard coming soon.</div>
      </div>
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
