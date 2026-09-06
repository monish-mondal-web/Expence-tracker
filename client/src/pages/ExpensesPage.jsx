import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ExpenseList } from '../components/ExpenseList';
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

  return (
    <div>
      {/* Monthly Total Header Banner */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {formatMonthYear(currentMonth, currentYear)}
          </span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
            Total Food Expense
          </h2>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => openAddExpense()}
          style={{ width: 'auto', margin: 0, padding: '0.75rem 1.25rem' }}
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search notes or category..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem', paddingRight: '0.75rem', height: '42px', fontSize: '0.88rem' }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ position: 'relative' }}>
          <Filter size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ paddingLeft: '2.3rem', height: '42px', fontSize: '0.88rem' }}
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
          <ArrowUpDown size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <select
            className="form-input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ paddingLeft: '2.3rem', height: '42px', fontSize: '0.88rem' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Loading food expenses...
        </div>
      ) : (
        <ExpenseList expenses={expenses} title="All Food Expenses" />
      )}
    </div>
  );
};
