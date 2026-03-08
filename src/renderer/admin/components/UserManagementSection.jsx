import React, { useState, useEffect } from 'react';

export function UserManagementSection() {
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    name: '',
    password: '',
    role: 'pos'
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  async function refreshUsers() {
    try {
      const userList = await window.api.listUsers();
      setUsers(userList || []);
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to load users' });
    }
  }

  function resetUserForm() {
    setUserForm({
      name: '',
      password: '',
      role: 'pos'
    });
    setEditingUserId(null);
  }

  function updateUserField(field, value) {
    setUserForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleUserSubmit(event) {
    event.preventDefault();
    
    if (!userForm.name.trim()) {
      setStatus({ type: 'error', text: 'User name is required' });
      return;
    }

    if (!editingUserId && !userForm.password.trim()) {
      setStatus({ type: 'error', text: 'Password is required for new users' });
      return;
    }

    try {
      const payload = {
        name: userForm.name.trim(),
        role: userForm.role
      };

      if (!editingUserId) {
        payload.password = userForm.password;
      }

      if (editingUserId) {
        await window.api.updateUser({ ...payload, id: editingUserId });
        setStatus({ type: 'success', text: 'User updated successfully' });
      } else {
        await window.api.createUser(payload);
        setStatus({ type: 'success', text: 'User created successfully' });
      }

      await refreshUsers();
      resetUserForm();
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to save user' });
    }
  }

  function handleUserEdit(user) {
    setUserForm({
      name: user.name || '',
      password: '',
      role: user.role || 'pos'
    });
    setEditingUserId(user.id);
  }

  async function handleUserDelete(id) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await window.api.deleteUser(id);
      await refreshUsers();
      setStatus({ type: 'success', text: 'User deleted successfully' });
      
      if (editingUserId === id) {
        resetUserForm();
      }
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Failed to delete user' });
    }
  }

  return (
    <section className="user-management-section">
      <h2>User Management</h2>
      
      {status && (
        <div className={`status ${status.type}`}>
          {status.text}
        </div>
      )}

      <form className="form-grid" onSubmit={handleUserSubmit}>
        <label>
          User Name
          <input
            required
            value={userForm.name}
            onChange={(e) => updateUserField('name', e.target.value)}
            placeholder="Enter user name"
          />
        </label>

        <label>
          Role
          <select 
            value={userForm.role} 
            onChange={(e) => updateUserField('role', e.target.value)}
          >
            <option value="pos">POS User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        {!editingUserId && (
          <label>
            Password
            <input
              type="password"
              required
              value={userForm.password}
              onChange={(e) => updateUserField('password', e.target.value)}
              placeholder="Enter password"
            />
          </label>
        )}

        <div className="form-actions">
          <button type="submit">
            {editingUserId ? 'Update User' : 'Add User'}
          </button>
          {editingUserId && (
            <button type="button" className="secondary" onClick={resetUserForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                    {user.role === 'admin' ? 'Admin' : 'POS'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      type="button" 
                      onClick={() => handleUserEdit(user)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleUserDelete(user.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={3} className="empty">
                  No users found. Add your first user above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
