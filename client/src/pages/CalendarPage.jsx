import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CalendarView } from '../components/CalendarView';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear } from '../utils/date';
import { Calendar as CalendarIcon } from 'lucide-react';

export const CalendarPage = () => {
  const { currentMonth, currentYear, refreshKey } = useApp();

  const [calendarData, setCalendarData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getCalendar(currentMonth, currentYear)
      .then((res) => {
        if (isMounted && res.success) {
          setCalendarData(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load calendar data', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentMonth, currentYear, refreshKey]);

  return (
    <div>
      {/* Calendar Header Banner */}
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
            Calendar Schedule
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
            {formatMonthYear(currentMonth, currentYear)}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Track daily food spending by date. Tap on any date to inspect transactions or add a new expense.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Month Spent
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(calendarData.totalSpent || 0)}
          </div>
        </div>
      </div>

      {/* Calendar Grid View */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading calendar view...
        </div>
      ) : (
        <CalendarView
          calendarData={calendarData}
          month={currentMonth}
          year={currentYear}
        />
      )}
    </div>
  );
};
