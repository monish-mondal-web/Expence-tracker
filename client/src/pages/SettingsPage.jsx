import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CategoryIcon, AVAILABLE_ICONS } from '../components/CategoryIcon';
import { CARTOON_AVATAR_PRESETS } from '../components/AuthScreen';
import { Target, DollarSign, Tag, Plus, Trash2, User, Loader2 } from 'lucide-react';

export const SettingsPage = () => {
  const {
    openSetBudget,
    categories,
    triggerRefresh,
    showToast,
    requestConfirm,
  } = useApp();

  const { user, updateProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || CARTOON_AVATAR_PRESETS[0]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
    if (user?.avatar) setSelectedAvatar(user.avatar);
  }, [user]);


  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    try {
      setIsSavingProfile(true);
      await updateProfile({
        name: profileName.trim(),
        avatar: selectedAvatar,
      });
      showToast('Profile updated successfully!');
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Custom category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [newCatColor, setNewCatColor] = useState('#10B981');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!newCatName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      setIsAddingCat(true);
      const res = await api.createCategory({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
      });

      if (res.success) {
        showToast(`Category "${newCatName.trim()}" created`);
        setNewCatName('');
        triggerRefresh();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleDeleteCategory = (cat) => {
    requestConfirm({
      title: 'Delete Custom Category',
      message: `Are you sure you want to delete "${cat.name}"?`,
      onConfirm: async () => {
        try {
          const res = await api.deleteCategory(cat._id);
          if (res.success) {
            showToast('Category deleted');
            triggerRefresh();
          }
        } catch (err) {
          showToast(err.message || 'Cannot delete default category', 'error');
        }
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 0. Profile Photo & Avatar */}
      <div className="transactions-section">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={20} color="#0F172A" />
            <h2>Your Profile Photo & Avatar Settings</h2>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Avatar Preview */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#F1F5F9',
                border: '2.5px solid #0F172A',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedAvatar ? (
                <img src={selectedAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A' }}>
                  {profileName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your Name"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                Account Email: <strong>{user?.email}</strong>
              </span>
            </div>
          </div>

          {/* Avatar Presets Picker */}
          <div style={{ background: 'var(--color-surface-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <label className="form-label" style={{ marginBottom: '0.6rem', fontWeight: 700, display: 'block' }}>
              Select Profile Avatar:
            </label>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {CARTOON_AVATAR_PRESETS.map((avatarUrl, idx) => {
                const presetTitle =
                  idx === 0
                    ? 'Male 1'
                    : idx === 1
                    ? 'Male 2'
                    : idx === 2
                    ? 'Female'
                    : idx === 3
                    ? 'Robot'
                    : 'Fun Character';
                return (
                  <img
                    key={idx}
                    src={avatarUrl}
                    alt={presetTitle}
                    title={presetTitle}
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      border: selectedAvatar === avatarUrl ? '2.5px solid #059669' : '2px solid transparent',
                      transform: selectedAvatar === avatarUrl ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                    }}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSavingProfile}
            style={{ width: 'auto', alignSelf: 'flex-start', margin: 0, padding: '0.65rem 1.4rem' }}
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* 1. Monthly Budget Management */}
      <div className="transactions-section">

        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={20} color="#0F172A" />
            <h2>Monthly Food Budget</h2>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
          Update your monthly food budget for the current month or configure budgets for any month. Safe daily limits and dynamic recommendations recalculate instantly.
        </p>

        <button
          type="button"
          className="btn-primary"
          onClick={openSetBudget}
          style={{ width: 'auto', padding: '0.75rem 1.5rem', display: 'inline-flex' }}
        >
          Manage Monthly Budget
        </button>
      </div>

      {/* 2. Currency Setting */}
      <div className="transactions-section">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DollarSign size={20} color="#0F172A" />
            <h2>Currency & Number Format</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
              Indian Rupee (₹ INR)
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Formatted in Indian numbering system (e.g. ₹1,000, ₹10,000, ₹1,00,000)
            </span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹
          </span>
        </div>
      </div>

      {/* 3. Category Management */}
      <div className="transactions-section">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={20} color="#0F172A" />
            <h2>Food Categories</h2>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
          Select from standard default food categories or add custom categories.
        </p>

        {/* Existing Categories List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          {categories.map((cat) => (
            <div
              key={cat._id || cat.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${cat.color || '#64748B'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIcon name={cat.icon} size={16} color={cat.color || '#64748B'} />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {cat.name}
                </span>
              </div>

              {!cat.isDefault && (
                <button
                  type="button"
                  className="action-icon-btn delete"
                  onClick={() => handleDeleteCategory(cat)}
                  title="Delete custom category"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Custom Category Form */}
        <div style={{ background: 'var(--color-surface-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Add Custom Food Category
          </h4>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Desserts, Street Food"
                  className="form-input"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Icon</label>
                <select
                  className="form-input"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                >
                  {AVAILABLE_ICONS.map((iconName) => (
                    <option key={iconName} value={iconName}>
                      {iconName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Color</label>
                <input
                  type="color"
                  className="form-input"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  style={{ height: '42px', padding: '2px 4px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isAddingCat}
              style={{ width: 'auto', alignSelf: 'flex-start', margin: 0, padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>{isAddingCat ? 'Adding...' : 'Add Category'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
