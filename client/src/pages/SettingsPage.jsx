import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CategoryIcon, AVAILABLE_ICONS } from '../components/CategoryIcon';
import { CARTOON_AVATAR_PRESETS } from '../components/AuthScreen';
import { Skeleton } from '../components/Skeleton';
import { PocketMoneyIcon } from '../components/PocketLogo';
import {
  ArrowUpRight,
  DollarSign,
  Tag,
  Plus,
  Trash2,
  User,
  Pencil,
  X,
  Link2,
  Info,
} from 'lucide-react';

const COLOR_SWATCHES = [
  '#10B981', // Emerald
  '#059669', // Forest Green
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#8B5CF6', // Purple
  '#0EA5E9', // Ocean Blue
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export const SettingsPage = () => {
  const {
    openSetBudget,
    categories,
    triggerRefresh,
    showToast,
    requestConfirm,
    dashboardData,
  } = useApp();

  const { user, updateProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || CARTOON_AVATAR_PRESETS[0]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Available spaces for category linking
  const defaultSpaces = [
    'Food & Dining',
    'Room Rent',
    'Bills & Utilities',
    'Household & Maid',
    'Travel & Commute',
    'Health & Medical',
    'Shopping & Lifestyle',
    'Education',
    'Personal Care',
    'Entertainment',
    'General',
  ];
  const availableSpaces = [...defaultSpaces];
  if (dashboardData?.spaces && Array.isArray(dashboardData.spaces)) {
    dashboardData.spaces.forEach((s) => {
      if (s.name && !availableSpaces.includes(s.name)) {
        availableSpaces.push(s.name);
      }
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

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
  const [newCatSpace, setNewCatSpace] = useState('Food & Dining');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Edit category modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('Utensils');
  const [editCatColor, setEditCatColor] = useState('#10B981');
  const [editCatSpace, setEditCatSpace] = useState('Food & Dining');
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name || '');
    setEditCatIcon(cat.icon || 'Utensils');
    setEditCatColor(cat.color || '#10B981');
    setEditCatSpace(cat.space || 'Food & Dining');
  };

  const closeEditCategory = () => {
    setEditingCategory(null);
  };

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
        space: newCatSpace,
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

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCatName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      setIsUpdatingCat(true);
      const res = await api.updateCategory(editingCategory._id, {
        name: editCatName.trim(),
        icon: editCatIcon,
        color: editCatColor,
        space: editCatSpace,
      });

      if (res.success) {
        showToast(`Category "${editCatName.trim()}" updated successfully`);
        closeEditCategory();
        triggerRefresh();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update category', 'error');
    } finally {
      setIsUpdatingCat(false);
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Profile Card Skeleton */}
        <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
            <Skeleton width="64px" height="64px" borderRadius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <Skeleton width="140px" height="20px" borderRadius="6px" />
              <Skeleton width="180px" height="14px" borderRadius="6px" />
            </div>
          </div>
          <Skeleton height="42px" borderRadius="var(--radius-md)" style={{ marginBottom: '1rem' }} />
          <Skeleton width="120px" height="38px" borderRadius="var(--radius-md)" />
        </div>

        {/* Monthly Budget Card Skeleton */}
        <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
          <Skeleton width="160px" height="22px" borderRadius="6px" style={{ marginBottom: '0.6rem' }} />
          <Skeleton height="36px" borderRadius="6px" style={{ marginBottom: '1rem' }} />
          <Skeleton width="180px" height="42px" borderRadius="var(--radius-md)" />
        </div>

        {/* Categories Card Skeleton */}
        <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
          <Skeleton width="160px" height="22px" borderRadius="6px" style={{ marginBottom: '1rem' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.2rem' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} width="110px" height="36px" borderRadius="20px" />
            ))}
          </div>
          <Skeleton height="44px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

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
            style={{ width: 'auto', alignSelf: 'flex-start', margin: 0, padding: '0.65rem 1.6rem' }}
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* 1. Monthly Budget Management Card */}
      <div className="transactions-section">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DollarSign size={20} color="#059669" />
            <h2>Monthly Budget Settings</h2>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Update your overall food spending limit and individual category budgets for the current month. Your dynamic safe daily spend and over-limit warnings update automatically.
        </p>

        <button
          type="button"
          className="btn-primary"
          onClick={openSetBudget}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: 'auto',
            padding: '0.75rem 1.4rem',
            borderRadius: 'var(--radius-lg)',
            margin: 0,
          }}
        >
          <span>Manage Monthly Budget & Limits</span>
          <ArrowUpRight size={18} />
        </button>
      </div>

      {/* 2. Custom Categories Management Card */}
      <div className="transactions-section">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={20} color="#059669" />
            <h2>Expense Categories Management</h2>
          </div>
        </div>

        {/* Add Category Form */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.4rem',
            marginBottom: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} color="#059669" strokeWidth={2.5} />
                </div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Add Custom Expense Category
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '3px 0 0' }}>
                Pick an icon (Maid, Chef, Rent, Travel, etc.), select a theme color, name it, and link to a Space.
              </p>
            </div>

            {/* Live Preview Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.35rem 0.8rem', borderRadius: '9999px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Preview:</span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '10px',
                  background: `${newCatColor}18`,
                  border: `1px solid ${newCatColor}35`,
                  color: newCatColor,
                }}
              >
                <CategoryIcon name={newCatIcon} size={15} color={newCatColor} />
                <strong style={{ fontSize: '0.82rem' }}>
                  {newCatName.trim() || 'New Category'}
                </strong>
                <span style={{ fontSize: '0.7rem', opacity: 0.75, marginLeft: '3px' }}>
                  ({newCatSpace})
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {/* Category Name */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maid, Cook, Electricity, Snacks"
                  className="form-input"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              {/* Category Linking to Space */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Link2 size={14} color="#059669" /> Link Category to Space:
                </label>
                <select
                  className="form-input"
                  value={newCatSpace}
                  onChange={(e) => setNewCatSpace(e.target.value)}
                >
                  {availableSpaces.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual Icon Grid */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                Select Icon: <span style={{ color: '#059669', fontWeight: 800 }}>{newCatIcon}</span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                  gap: '8px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  padding: '8px',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E2E8F0',
                }}
              >
                {AVAILABLE_ICONS.map((iconName) => {
                  const isSelected = newCatIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setNewCatIcon(iconName)}
                      title={iconName}
                      style={{
                        height: '42px',
                        borderRadius: '10px',
                        background: isSelected ? '#FFFFFF' : 'transparent',
                        border: isSelected ? `2px solid ${newCatColor}` : '1px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CategoryIcon
                        name={iconName}
                        size={20}
                        color={isSelected ? newCatColor : '#64748B'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                Select Color:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {COLOR_SWATCHES.map((colorHex) => {
                  const isSelected = newCatColor.toLowerCase() === colorHex.toLowerCase();
                  return (
                    <button
                      key={colorHex}
                      type="button"
                      onClick={() => setNewCatColor(colorHex)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: colorHex,
                        border: isSelected ? '3px solid #0F172A' : '2px solid #FFFFFF',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                      }}
                      title={colorHex}
                    />
                  );
                })}

                {/* Custom Color Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    style={{
                      width: '34px',
                      height: '34px',
                      padding: '2px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    title="Choose custom color"
                  />
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'monospace' }}>
                    {newCatColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Add Category Button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isAddingCat}
              style={{
                width: 'auto',
                alignSelf: 'flex-start',
                margin: 0,
                padding: '0.7rem 1.6rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>{isAddingCat ? 'Adding Category...' : 'Add Category'}</span>
            </button>
          </form>
        </div>

        {/* 2. Existing Categories Grid */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Available Categories ({categories.length})
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Default & custom categories with linked spaces</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${cat.color || '#64748B'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CategoryIcon name={cat.icon} size={17} color={cat.color || '#64748B'} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                    <Link2 size={10} color="#059669" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.space || 'Food & Dining'}
                    </span>
                  </span>
                </div>
              </div>

              {!cat.isDefault && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
                  <button
                    type="button"
                    className="action-icon-btn edit"
                    onClick={() => openEditCategory(cat)}
                    title={`Edit ${cat.name}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() => handleDeleteCategory(cat)}
                    title={`Delete ${cat.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
              </div>
            ))}
          </div>
        </div>

      {/* App Version & Release Notes */}
      <div className="fintech-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PocketMoneyIcon size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Pocket Khorcha</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Version 1.2 (Offline-First Edition)</p>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '999px' }}>
            Latest
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: 1.45 }}>
          Now with 100% offline access, automatic background cloud sync, category editing, and 80+ icons.
        </p>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.dispatchEvent(new CustomEvent('pk:open-update-modal'))}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '0.75rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            borderRadius: '12px',
          }}
        >
          <Info size={16} color="#059669" />
          <span>View What's New in v1.2</span>
        </button>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-overlay" onClick={closeEditCategory}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '92%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${editCatColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIcon name={editCatIcon} size={18} color={editCatColor} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Edit Category</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeEditCategory}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', padding: '1.25rem' }}>
              {/* Live Preview */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Preview:</span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '10px',
                    background: `${editCatColor}18`,
                    border: `1px solid ${editCatColor}35`,
                    color: editCatColor,
                  }}
                >
                  <CategoryIcon name={editCatIcon} size={16} color={editCatColor} />
                  <strong style={{ fontSize: '0.88rem' }}>{editCatName.trim() || 'Category Name'}</strong>
                  <span style={{ fontSize: '0.72rem', opacity: 0.8, marginLeft: '4px' }}>({editCatSpace})</span>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                  Category Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  placeholder="e.g. Maid, Cook, Electricity"
                  required
                />
              </div>

              {/* Link to Space */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Link2 size={14} color="#059669" /> Link Category to Space:
                </label>
                <select
                  className="form-input"
                  value={editCatSpace}
                  onChange={(e) => setEditCatSpace(e.target.value)}
                >
                  {availableSpaces.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Expenses under this Space will use this category.
                </span>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                  Select Icon: <span style={{ color: '#059669', fontWeight: 800 }}>{editCatIcon}</span>
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
                    gap: '8px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    padding: '8px',
                    background: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {AVAILABLE_ICONS.map((iconName) => {
                    const isSelected = editCatIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setEditCatIcon(iconName)}
                        title={iconName}
                        style={{
                          height: '42px',
                          borderRadius: '10px',
                          background: isSelected ? '#FFFFFF' : 'transparent',
                          border: isSelected ? `2px solid ${editCatColor}` : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <CategoryIcon name={iconName} size={20} color={isSelected ? editCatColor : '#64748B'} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                  Color Theme:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {COLOR_SWATCHES.map((colorHex) => {
                    const isSelected = editCatColor.toLowerCase() === colorHex.toLowerCase();
                    return (
                      <button
                        key={colorHex}
                        type="button"
                        onClick={() => setEditCatColor(colorHex)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: colorHex,
                          border: isSelected ? '3px solid #0F172A' : '2px solid #FFFFFF',
                          cursor: 'pointer',
                          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                        }}
                        title={colorHex}
                      />
                    );
                  })}
                  <input
                    type="color"
                    value={editCatColor}
                    onChange={(e) => setEditCatColor(e.target.value)}
                    style={{
                      width: '34px',
                      height: '34px',
                      padding: '2px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    title="Choose custom color"
                  />
                </div>
              </div>

              {/* Save / Cancel Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '0.4rem' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdatingCat}
                  style={{ flex: 1, margin: 0 }}
                >
                  {isUpdatingCat ? 'Saving Changes...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeEditCategory}
                  style={{ margin: 0, padding: '0 1.2rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
