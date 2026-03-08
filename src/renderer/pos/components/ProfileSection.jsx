import React, { useState, useEffect } from 'react';

export function ProfileSection({ user, onUserUpdate }) {
  const [profileForm, setProfileForm] = useState({
    name: ''
  });
  const [status, setStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || ''
      });
    }
  }, [user]);

  function updateProfileField(field, value) {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    
    if (!profileForm.name.trim()) {
      setStatus({ type: 'error', text: 'Name is required' });
      return;
    }

    if (profileForm.name.trim() === user.name.trim()) {
      setStatus({ type: 'info', text: 'No changes to save' });
      return;
    }

    try {
      const updatedUser = await window.api.updateUserProfile({
        currentName: user.name,
        name: profileForm.name.trim()
      });
      
      setStatus({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Update the user in parent component
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to update profile' });
    }
  }

  function handleEditToggle() {
    setIsEditing(!isEditing);
    setStatus(null);
  }

  return (
    <section>
      <h2>My Profile</h2>
      
      <div className="profile-info">
        <div className="info-card">
          <h3>Current Information</h3>
          <div className="info-item">
            <label>Username:</label>
            <span>{user?.name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <label>Role:</label>
            <span className={`badge ${user?.role === 'admin' ? 'admin' : 'user'}`}>
              {user?.role === 'admin' ? 'Admin' : 'POS User'}
            </span>
          </div>
        </div>
      </div>

      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      <div className="profile-edit">
        {!isEditing ? (
          <div className="edit-actions">
            <button 
              type="button" 
              onClick={handleEditToggle}
              className="primary"
            >
              Edit My Name
            </button>
          </div>
        ) : (
          <form className="form-grid" onSubmit={handleProfileSubmit}>
            <label>
              New Name
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => updateProfileField('name', e.target.value)}
                placeholder="Enter your new name"
                maxLength={50}
              />
            </label>

            <div className="form-actions">
              <button type="submit">
                Update Name
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
