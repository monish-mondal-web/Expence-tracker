import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CalendarView } from '../components/CalendarView';
import { Skeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/currency';
import { formatMonthYear } from '../utils/date';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarPage = () => {
  const { currentMonth, currentYear, refreshKey, prevMonth, nextMonth } = useApp();

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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Skeleton height="78px" borderRadius="var(--radius-xl)" />
        <Skeleton height="410px" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  return (
    <div>
      {/* Compact Modern Calendar Header Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CalendarIcon size={20} color="#10B981" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Calendar Schedule
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                {formatMonthYear(currentMonth, currentYear)}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                <button
                  type="button"
                  onClick={prevMonth}
                  title="Previous month"
                  style={{
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#475569',
                    padding: 0,
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  title="Next month"
                  style={{
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#475569',
                    padding: 0,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, display: 'block' }}>
            Month Spent
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            {formatCurrency(calendarData.totalSpent || 0)}
          </div>
        </div>
      </div>

      {/* Calendar Grid View */}
      <CalendarView
        calendarData={calendarData}
        month={currentMonth}
        year={currentYear}
      />
    </div>
  );
};

export default CalendarPage;
