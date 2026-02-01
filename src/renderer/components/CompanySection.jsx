import React from 'react';

export function CompanySection({ form, onFieldChange, onSubmit }) {
  return (
    <section>
      <h2>Company Setup</h2>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Company Name
          <input
            required
            value={form.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
          />
        </label>
        <label>
          GSTIN
          <input value={form.gstin} onChange={(e) => onFieldChange('gstin', e.target.value)} />
        </label>
        <label className="full">
          Address
          <textarea
            rows={3}
            value={form.address}
            onChange={(e) => onFieldChange('address', e.target.value)}
          />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={(e) => onFieldChange('phone', e.target.value)} />
        </label>
        <div className="full">
          <button type="submit">Save Company</button>
        </div>
      </form>
    </section>
  );
}
