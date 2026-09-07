import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CategoryIcon, AVAILABLE_ICONS } from '../components/CategoryIcon';
import { CARTOON_AVATAR_PRESETS } from '../components/AuthScreen';
import { Skeleton } from '../components/Skeleton';
import { ArrowUpRight, DollarSign, Tag, Plus, Trash2, User, Loader2 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);

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

        {/* Currency Card Skeleton */}
        <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
          <Skeleton width="190px" height="20px" borderRadius="6px" style={{ marginBottom: '0.6rem' }} />
          <Skeleton height="46px" borderRadius="var(--radius-md)" />
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
            <ArrowUpRight size={20} color="#0F172A" />
            <h2>Monthly Budget</h2>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
          Set your monthly budget for categories (Food, Travel, Tour, Room Rent, Health, Gym & more). Safe daily limits and dynamic recommendations recalculate instantly.
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
            <h2>Expense Categories</h2>
          </div>
        </div>

        {/* 1. ADD CUSTOM EXPENSE CATEGORY AT THE TOP */}
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
                Pick an icon, select a vibrant theme color, and name your category.
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
              </div>
            </div>
          </div>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Category Name */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
                Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Desserts, Street Food, Midnight Munchies"
                className="form-input"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
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
                  maxHeight: '136px',
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
                {[
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
                ].map((colorHex) => {
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
            Available Food Categories ({categories.length})
          </h4>
          <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Default & custom food categories</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
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
      </div>
    </div>
  );
};
