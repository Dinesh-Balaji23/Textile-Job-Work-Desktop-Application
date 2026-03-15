const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let dbFilePath;
let dbInstance;
let dbReadyPromise;

async function initializeDatabase(dbPath) {
  dbFilePath = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
  await getDb();
  await persist();
}

async function getDb() {
  if (!dbReadyPromise) {
    if (!dbFilePath) {
      throw new Error('Database path not configured');
    }
    dbReadyPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: (file) => path.join(__dirname, '../../node_modules/sql.js/dist', file)
      });
      const existingFile = fs.existsSync(dbFilePath) ? fs.readFileSync(dbFilePath) : null;
      const db = existingFile ? new SQL.Database(new Uint8Array(existingFile)) : new SQL.Database();
      db.exec('PRAGMA foreign_keys = ON;');
      createTables(db);
      dbInstance = db;
      return db;
    })();
  }
  return dbReadyPromise;
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'pos'))
    );

    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      gstin TEXT,
      address TEXT,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS gst_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      cgst_rate REAL NOT NULL DEFAULT 0.025,
      sgst_rate REAL NOT NULL DEFAULT 0.025,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      gstin TEXT,
      state TEXT,
      state_code TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      rate REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number INTEGER NOT NULL UNIQUE,
      invoice_date TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      cgst REAL NOT NULL,
      sgst REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      description TEXT,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
  `);

  seedDefaultUsers(db);
  seedDefaultGSTSettings(db);
}

function seedDefaultUsers(db) {
  const existing = queryOne(db, 'SELECT COUNT(*) as count FROM users');
  if (existing?.count) {
    return;
  }

  const defaults = [
    { name: 'admin', password: 'admin123', role: 'admin' },
    { name: 'pos', password: 'pos123', role: 'pos' }
  ];

  defaults.forEach((user) => {
    run(
      db,
      `INSERT INTO users (name, password, role)
       VALUES (:name, :password, :role)`,
      user
    );
  });
}

function seedDefaultGSTSettings(db) {
  const existing = queryOne(db, 'SELECT COUNT(*) as count FROM gst_settings');
  if (existing?.count) {
    return;
  }

  run(
    db,
    `INSERT INTO gst_settings (id, cgst_percent, sgst_percent, enabled, updated_at)
     VALUES (1, 2.5, 2.5, 1, datetime('now'))`
  );
}

async function persist() {
  if (!dbInstance || !dbFilePath) return;
  const binary = dbInstance.export();
  fs.writeFileSync(dbFilePath, Buffer.from(binary));
}

function normalizeParams(params = {}) {
  if (Array.isArray(params)) {
    return params;
  }
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key.startsWith(':') ? key : `:${key}`, value])
  );
}

function run(db, sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(normalizeParams(params));
  stmt.step();
  stmt.free();
}

function queryAll(db, sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(normalizeParams(params));
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(db, sql, params = {}) {
  const rows = queryAll(db, sql, params);
  return rows[0] || null;
}

function lastInsertRowId(db) {
  const row = queryOne(db, 'SELECT last_insert_rowid() as id');
  return row ? row.id : null;
}

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function sanitizeItemPayload(data = {}) {
  return {
    name: normalizeText(data.name),
    category: normalizeText(data.category),
    unit: data.unit || 'Nos',
    quantity: Number(data.quantity) || 0,
    rate: Number(data.rate) || 0
  };
}

async function getCompany() {
  const db = await getDb();
  return queryOne(db, 'SELECT * FROM company WHERE id = 1');
}

async function authenticateUser({ name, password }) {
  const db = await getDb();
  return queryOne(db, 'SELECT id, name, role FROM users WHERE name = :name AND password = :password', {
    name,
    password
  });
}

async function listUsers() {
  const db = await getDb();
  return queryAll(db, 'SELECT id, name, role FROM users ORDER BY name');
}

async function createUser(user) {
  const db = await getDb();
  run(
    db,
    `INSERT INTO users (name, password, role)
     VALUES (:name, :password, :role)`,
    user
  );
  const id = lastInsertRowId(db);
  await persist();
  return getUser(id);
}

async function updateUser(id, user) {
  const db = await getDb();
  const updates = [];
  const params = { id };
  
  if (user.name !== undefined) {
    updates.push('name = :name');
    params.name = user.name;
  }
  if (user.password !== undefined) {
    updates.push('password = :password');
    params.password = user.password;
  }
  if (user.role !== undefined) {
    updates.push('role = :role');
    params.role = user.role;
  }
  
  if (updates.length === 0) {
    throw new Error('No fields to update');
  }
  
  run(
    db,
    `UPDATE users SET ${updates.join(', ')} WHERE id = :id`,
    params
  );
  await persist();
  return getUser(id);
}

async function deleteUser(id) {
  const db = await getDb();
  run(db, 'DELETE FROM users WHERE id = :id', { id });
  await persist();
  return listUsers();
}

async function getUser(id) {
  const db = await getDb();
  return queryOne(db, 'SELECT id, name, role FROM users WHERE id = :id', { id });
}

async function updateUserByName(name, updates) {
  const db = await getDb();
  const updateFields = [];
  const params = { name };
  
  if (updates.name !== undefined) {
    updateFields.push('name = :newName');
    params.newName = updates.name;
  }
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  run(
    db,
    `UPDATE users SET ${updateFields.join(', ')} WHERE name = :name`,
    params
  );
  await persist();
  return getUserByName(updates.name || name);
}

async function getUserByName(name) {
  const db = await getDb();
  return queryOne(db, 'SELECT id, name, role FROM users WHERE name = :name', { name });
}

async function getGSTSettings() {
  const db = await getDb();
  
  // First try to get settings to see if table exists and has the right structure
  try {
    console.log('Getting GST settings from database...');
    const settings = queryOne(db, 'SELECT * FROM gst_settings WHERE id = 1');
    console.log('GST settings query result:', settings);
    console.log('Settings enabled type:', typeof settings?.enabled);
    console.log('Settings cgst_percent:', settings?.cgst_percent);
    console.log('Settings sgst_percent:', settings?.sgst_percent);
    
    if (settings && (settings.enabled === 1 || settings.enabled === 0 || settings.enabled === true || settings.enabled === false)) {
      // Table exists and has enabled column, return settings
      console.log('Returning existing GST settings');
      return settings;
    }
  } catch (error) {
    console.log('Error getting GST settings:', error);
    // Table doesn't exist or has wrong structure, create it fresh
  }
  
  // Drop and recreate table to ensure proper structure
  console.log('Recreating GST settings table...');
  run(db, 'DROP TABLE IF EXISTS gst_settings');
  
  run(db, `
    CREATE TABLE gst_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      cgst_percent REAL NOT NULL DEFAULT 2.5,
      sgst_percent REAL NOT NULL DEFAULT 2.5,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Insert default settings
  run(
    db,
    `INSERT INTO gst_settings (id, cgst_percent, sgst_percent, enabled, updated_at)
     VALUES (1, 2.5, 2.5, 1, datetime('now'))`
  );
  
  await persist();
  
  // Try to get settings again
  console.log('Getting GST settings after recreation...');
  const newSettings = queryOne(db, 'SELECT * FROM gst_settings WHERE id = 1');
  console.log('New GST settings:', newSettings);
  return newSettings;
}

async function updateGSTSettings(settings) {
  const db = await getDb();
  const updates = [];
  const params = { id: 1 };
  
  if (settings.cgst_percent !== undefined) {
    updates.push('cgst_percent = :cgst_percent');
    params.cgst_percent = settings.cgst_percent;
  }
  
  if (settings.sgst_percent !== undefined) {
    updates.push('sgst_percent = :sgst_percent');
    params.sgst_percent = settings.sgst_percent;
  }
  
  if (settings.enabled !== undefined) {
    updates.push('enabled = :enabled');
    params.enabled = settings.enabled;
  }
  
  if (updates.length === 0) {
    throw new Error('No fields to update');
  }
  
  run(
    db,
    `UPDATE gst_settings SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = :id`,
    params
  );
  await persist();
  return getGSTSettings();
}

async function saveCompany(payload) {
  const db = await getDb();
  run(
    db,
    `INSERT INTO company (id, name, gstin, address, phone)
     VALUES (1, :name, :gstin, :address, :phone)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       gstin = excluded.gstin,
       address = excluded.address,
       phone = excluded.phone`,
    payload
  );
  await persist();
  return getCompany();
}

async function listCustomers() {
  const db = await getDb();
  return queryAll(db, 'SELECT * FROM customers ORDER BY name');
}

async function createCustomer(customer) {
  const db = await getDb();
  run(
    db,
    `INSERT INTO customers (name, address, gstin, state, state_code)
     VALUES (:name, :address, :gstin, :state, :state_code)`,
    customer
  );
  const id = lastInsertRowId(db);
  await persist();
  return getCustomer(id);
}

async function updateCustomer(id, customer) {
  const db = await getDb();
  run(
    db,
    `UPDATE customers SET
       name = :name,
       address = :address,
       gstin = :gstin,
       state = :state,
       state_code = :state_code
     WHERE id = :id`,
    { ...customer, id }
  );
  await persist();
  return getCustomer(id);
}

async function deleteCustomer(id) {
  const db = await getDb();
  run(db, 'DELETE FROM customers WHERE id = :id', { id });
  await persist();
  return listCustomers();
}

async function getCustomer(id) {
  const db = await getDb();
  return queryOne(db, 'SELECT * FROM customers WHERE id = :id', { id });
}

async function listItems() {
  const db = await getDb();
  return queryAll(db, 'SELECT * FROM items ORDER BY name');
}

async function createItem(item) {
  const db = await getDb();
  const payload = sanitizeItemPayload(item);
  if (!payload.name) {
    console.error('createItem called with invalid payload', item);
    throw new Error('Item name is required');
  }
  run(
    db,
    `INSERT INTO items (name, category, unit, quantity, rate)
     VALUES (:name, :category, :unit, :quantity, :rate)`,
    payload
  );
  const id = lastInsertRowId(db);
  await persist();
  return getItem(id);
}

async function updateItem(id, updates) {
  const db = await getDb();
  const payload = {
    ...sanitizeItemPayload(updates),
    id
  };
  if (!payload.name) {
    throw new Error('Item name is required');
  }
  run(
    db,
    `UPDATE items SET
       name = :name,
       category = :category,
       unit = :unit,
       quantity = :quantity,
       rate = :rate
     WHERE id = :id`,
    payload
  );
  await persist();
  return getItem(id);
}

async function adjustItemQuantity(id, quantity) {
  const db = await getDb();
  run(db, 'UPDATE items SET quantity = :quantity WHERE id = :id', {
    id,
    quantity: Number(quantity) || 0
  });
  await persist();
  return getItem(id);
}

async function deleteItem(id) {
  const db = await getDb();
  run(db, 'DELETE FROM items WHERE id = :id', { id });
  await persist();
  return true;
}

async function getItem(id) {
  const db = await getDb();
  return queryOne(db, 'SELECT * FROM items WHERE id = :id', { id });
}

function computeNextInvoiceNumber(db) {
  const row = queryOne(db, 'SELECT MAX(invoice_number) as max_no FROM invoices');
  return (row?.max_no || 0) + 1;
}

async function listInvoices() {
  const db = await getDb();
  return queryAll(
    db,
    `SELECT invoices.*, customers.name as customer_name
     FROM invoices
     LEFT JOIN customers ON customers.id = invoices.customer_id
     ORDER BY invoices.invoice_date DESC, invoices.invoice_number DESC`
  );
}

async function getInvoiceDetails(id) {
  const db = await getDb();
  const invoice = queryOne(
    db,
    `SELECT invoices.*, customers.name as customer_name, customers.address as customer_address,
            customers.gstin as customer_gstin, customers.state as customer_state,
            customers.state_code as customer_state_code
     FROM invoices
     LEFT JOIN customers ON customers.id = invoices.customer_id
     WHERE invoices.id = :id`,
    { id }
  );

  if (!invoice) return null;

  const items = queryAll(
    db,
    `SELECT invoice_items.*, items.name as item_name, items.unit as item_unit
     FROM invoice_items
     LEFT JOIN items ON items.id = invoice_items.item_id
     WHERE invoice_items.invoice_id = :id`,
    { id }
  );

  return { invoice, items };
}

async function createInvoice(payload) {
  const db = await getDb();
  const items = payload.items || [];
  if (!items.length) {
    throw new Error('Invoice requires at least one item');
  }

  // Get GST settings for calculations
  const gstSettings = await getGSTSettings();
  const cgstRate = (gstSettings?.cgst_percent || 2.5) / 100;
  const sgstRate = (gstSettings?.sgst_percent || 2.5) / 100;
  const gstEnabled = gstSettings?.enabled !== false;

  db.exec('BEGIN TRANSACTION;');
  try {
    const invoiceNumber = computeNextInvoiceNumber(db);
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    let cgst = 0;
    let sgst = 0;
    
    if (gstEnabled) {
      cgst = +(subtotal * cgstRate).toFixed(2);
      sgst = +(subtotal * sgstRate).toFixed(2);
    }
    
    const total = +(subtotal + cgst + sgst).toFixed(2);

    run(
      db,
      `INSERT INTO invoices (invoice_number, invoice_date, customer_id, subtotal, cgst, sgst, total)
       VALUES (:invoice_number, :invoice_date, :customer_id, :subtotal, :cgst, :sgst, :total)`,
      {
        invoice_number: invoiceNumber,
        invoice_date: payload.invoice_date,
        customer_id: payload.customer_id,
        subtotal,
        cgst,
        sgst,
        total
      }
    );

    const invoiceId = lastInsertRowId(db);

    items.forEach((item) => {
      const preparedItem = {
        invoice_id: invoiceId,
        item_id: Number(item.item_id),
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0
      };

      run(
        db,
        `INSERT INTO invoice_items (invoice_id, item_id, description, quantity, rate, amount)
         VALUES (:invoice_id, :item_id, :description, :quantity, :rate, :amount)`,
        preparedItem
      );

      run(
        db,
        'UPDATE items SET quantity = quantity - :quantity WHERE id = :id',
        { id: preparedItem.item_id, quantity: preparedItem.quantity }
      );
    });

    db.exec('COMMIT;');
    await persist();
    return getInvoiceDetails(invoiceId);
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

async function getNextInvoiceNumber() {
  const db = await getDb();
  return computeNextInvoiceNumber(db);
}

// Reports functions
async function getSalesReport(startDate, endDate) {
  const db = await getDb();
  const query = `
    SELECT 
      i.invoice_date as date,
      i.invoice_number,
      i.total,
      i.subtotal,
      i.cgst,
      i.sgst,
      c.name as customer_name,
      COUNT(ii.id) as item_count
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
    WHERE i.invoice_date BETWEEN :startDate AND :endDate
    GROUP BY i.id
    ORDER BY i.invoice_date DESC
  `;
  
  const results = queryAll(db, query, { startDate, endDate });
  
  // Calculate totals
  const totals = results.reduce((acc, row) => ({
    totalSales: acc.totalSales + row.total,
    totalCGST: acc.totalCGST + row.cgst,
    totalSGST: acc.totalSGST + row.sgst,
    totalBills: acc.totalBills + 1,
    totalItems: acc.totalItems + row.item_count
  }), {
    totalSales: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalBills: 0,
    totalItems: 0
  });
  
  return {
    data: results,
    totals,
    period: { startDate, endDate }
  };
}

async function getGSTReport(startDate, endDate) {
  const db = await getDb();
  const query = `
    SELECT 
      i.invoice_date as date,
      i.invoice_number,
      i.subtotal,
      i.cgst,
      i.sgst,
      i.total,
      c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.invoice_date BETWEEN :startDate AND :endDate
      AND i.total > 0
    ORDER BY i.invoice_date DESC
  `;
  
  const results = queryAll(db, query, { startDate, endDate });
  
  // Calculate GST totals
  const totals = results.reduce((acc, row) => ({
    totalCGST: acc.totalCGST + row.cgst,
    totalSGST: acc.totalSGST + row.sgst,
    totalGST: acc.totalGST + row.cgst + row.sgst,
    totalSubtotal: acc.totalSubtotal + row.subtotal,
    totalInvoices: acc.totalInvoices + 1
  }), {
    totalCGST: 0,
    totalSGST: 0,
    totalGST: 0,
    totalSubtotal: 0,
    totalInvoices: 0
  });
  
  return {
    data: results,
    totals,
    period: { startDate, endDate }
  };
}

async function getInventoryReport() {
  const db = await getDb();
  const query = `
    SELECT 
      id,
      name,
      category,
      unit,
      quantity,
      rate,
      quantity * rate as total_value,
      CASE 
        WHEN quantity < 20 THEN 'Low Stock'
        ELSE 'Available'
      END as stock_status
    FROM items
    ORDER BY 
      CASE 
        WHEN quantity < 20 THEN 0 
        ELSE 1 
      END,
      name
  `;
  
  const results = queryAll(db, query);
  
  // Calculate inventory totals
  const totals = results.reduce((acc, row) => ({
    totalItems: acc.totalItems + 1,
    totalQuantity: acc.totalQuantity + row.quantity,
    totalValue: acc.totalValue + row.total_value,
    lowStockItems: acc.lowStockItems + (row.quantity < 20 ? 1 : 0)
  }), {
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStockItems: 0
  });
  
  return {
    data: results,
    totals
  };
}

async function getTopSellingItems(startDate, endDate, limit = 10) {
  const db = await getDb();
  const query = `
    SELECT 
      i.name,
      i.category,
      i.unit,
      SUM(ii.quantity) as total_sold,
      SUM(ii.amount) as total_revenue,
      COUNT(DISTINCT ii.invoice_id) as invoice_count
    FROM items i
    INNER JOIN invoice_items ii ON i.id = ii.item_id
    INNER JOIN invoices inv ON ii.invoice_id = inv.id
    WHERE inv.invoice_date BETWEEN :startDate AND :endDate
    GROUP BY i.id
    ORDER BY total_sold DESC
    LIMIT :limit
  `;
  
  return queryAll(db, query, { startDate, endDate, limit });
}

async function getCustomerSalesReport(startDate, endDate) {
  const db = await getDb();
  const query = `
    SELECT 
      c.id,
      c.name,
      c.phone,
      COUNT(DISTINCT i.id) as invoice_count,
      SUM(i.total) as total_spent,
      AVG(i.total) as avg_invoice_value,
      MAX(i.invoice_date) as last_purchase_date
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    WHERE i.invoice_date BETWEEN :startDate AND :endDate OR i.invoice_date IS NULL
    GROUP BY c.id
    ORDER BY total_spent DESC
  `;
  
  return queryAll(db, query, { startDate, endDate });
}

module.exports = {
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
};
