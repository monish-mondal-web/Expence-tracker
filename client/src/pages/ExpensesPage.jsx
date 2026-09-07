import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ExpenseList } from '../components/ExpenseList';
import { Skeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear } from '../utils/date';
import { Search, Filter, ArrowUpDown, Plus } from 'lucide-react';

export const ExpensesPage = () => {
  const { currentMonth, currentYear, refreshKey, categories, openAddExpense } = useApp();

  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getExpenses({
      month: currentMonth,
      year: currentYear,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      search: search.trim() || undefined,
      sort: sortOrder,
    })
      .then((res) => {
        if (isMounted && res.success) {
          setExpenses(res.data || []);
          setTotalAmount(res.totalAmount || 0);
        }
      })
      .catch((err) => {
        console.error('Failed to load expenses', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMonth, currentYear, selectedCategory, search, sortOrder, refreshKey]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Skeleton height="95px" borderRadius="var(--radius-xl)" />
        <Skeleton height="56px" borderRadius="var(--radius-lg)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Skeleton height="64px" borderRadius="var(--radius-lg)" />
          <Skeleton height="64px" borderRadius="var(--radius-lg)" />
          <Skeleton height="64px" borderRadius="var(--radius-lg)" />
          <Skeleton height="64px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Monthly Total Header Banner */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {formatMonthYear(currentMonth, currentYear)}
          </span>
          <h2 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0.1rem 0' }}>
            Total Expenses
          </h2>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => openAddExpense()}
          style={{ width: 'auto', margin: 0, padding: '0.65rem 1.25rem' }}
        >
          <Plus size={17} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.65rem',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search notes or category..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              height: '44px',
              fontSize: '0.88rem',
              lineHeight: '1.4',
              borderRadius: '10px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ position: 'relative' }}>
          <Filter size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.55rem 1.8rem 0.55rem 2.4rem',
              height: '44px',
              fontSize: '0.88rem',
              lineHeight: '1.4',
              color: '#0F172A',
              borderRadius: '10px',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c._id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div style={{ position: 'relative' }}>
          <ArrowUpDown size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select
            className="form-input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '0.55rem 1.8rem 0.55rem 2.4rem',
              height: '44px',
              fontSize: '0.88rem',
              lineHeight: '1.4',
              color: '#0F172A',
              borderRadius: '10px',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      <ExpenseList expenses={expenses} title="All Expenses" />
    </div>
  );
};

export default ExpensesPage;
