import React, { useState, useEffect } from 'react';

export function GSTConfigurationSection() {
  const [gstSettings, setGSTSettings] = useState({
    cgst_percent: 2.5,
    sgst_percent: 2.5,
    enabled: true
  });
  const [form, setForm] = useState({
    cgst_percent: '',
    sgst_percent: '',
    enabled: true
  });
  const [status, setStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadGSTSettings();
  }, []);

  async function loadGSTSettings() {
    try {
      const settings = await window.api.getGSTSettings();
      if (settings) {
        setGSTSettings(settings);
        setForm({
          cgst_percent: (settings.cgst_percent).toString(),
          sgst_percent: (settings.sgst_percent).toString(),
          enabled: settings.enabled
        });
      }
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to load GST settings' });
    }
  }

  function updateFormField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleEditToggle() {
    setIsEditing(!isEditing);
    setStatus(null);
  }

  async function handleGSTSubmit(event) {
    event.preventDefault();
    
    const cgstPercent = parseFloat(form.cgst_percent);
    const sgstPercent = parseFloat(form.sgst_percent);
    
    if (isNaN(cgstPercent) || isNaN(sgstPercent)) {
      setStatus({ type: 'error', text: 'Invalid GST rates. Please enter valid numbers.' });
      return;
    }

    if (cgstPercent < 0 || cgstPercent > 100 || sgstPercent < 0 || sgstPercent > 100) {
      setStatus({ type: 'error', text: 'GST rates must be between 0% and 100%' });
      return;
    }

    try {
      const updatedSettings = await window.api.updateGSTSettings({
        cgst_percent: cgstPercent,
        sgst_percent: sgstPercent,
        enabled: form.enabled
      });
      
      setGSTSettings(updatedSettings);
      setStatus({ type: 'success', text: 'GST settings updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to update GST settings' });
    }
  }

  function calculateTotalGST() {
    return ((gstSettings.cgst_percent || 0) + (gstSettings.sgst_percent || 0));
  }

  return (
    <section>
      <h2>GST Configuration</h2>
      
      <div className="gst-info">
        <div className="info-card">
          <h3>Current GST Settings</h3>
          <div className="info-item">
            <label>Status:</label>
            <span className={`badge ${gstSettings.enabled ? 'enabled' : 'disabled'}`}>
              {gstSettings.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="info-item">
            <label>CGST Rate:</label>
            <span>{(gstSettings.cgst_percent || 0).toFixed(2)}%</span>
          </div>
          <div className="info-item">
            <label>SGST Rate:</label>
            <span>{(gstSettings.sgst_percent || 0).toFixed(2)}%</span>
          </div>
          <div className="info-item">
            <label>Total GST:</label>
            <span className="total-gst">{calculateTotalGST().toFixed(2)}%</span>
          </div>
          <div className="info-item">
            <label>Last Updated:</label>
            <span>{gstSettings.updated_at ? new Date(gstSettings.updated_at).toLocaleString() : 'Never'}</span>
          </div>
        </div>
      </div>

      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      <div className="gst-edit">
        {!isEditing ? (
          <div className="edit-actions">
            <button 
              type="button" 
              onClick={handleEditToggle}
              className="primary"
            >
              Edit GST Settings
            </button>
          </div>
        ) : (
          <form className="form-grid" onSubmit={handleGSTSubmit}>
            <label>
              CGST Rate (%)
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.cgst_percent}
                onChange={(e) => updateFormField('cgst_percent', e.target.value)}
                placeholder="Enter CGST rate as percentage"
              />
            </label>

            <label>
              SGST Rate (%)
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.sgst_percent}
                onChange={(e) => updateFormField('sgst_percent', e.target.value)}
                placeholder="Enter SGST rate as percentage"
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => updateFormField('enabled', e.target.checked)}
              />
              Enable GST Calculations
            </label>

            <div className="form-actions">
              <button type="submit">
                Update GST Settings
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={handleEditToggle}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
