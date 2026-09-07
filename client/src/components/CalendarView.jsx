import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { toLocalISODate, formatFullDate } from '../utils/date';
import { useApp } from '../context/AppContext';
import { Plus, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

export const CalendarView = ({ calendarData = {}, month, year }) => {
  const { openAddExpense, todayDate } = useApp();
  const [selectedDateStr, setSelectedDateStr] = useState(todayDate);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days matrix
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null); // empty padding cell
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      dateStr,
      data: calendarData.calendarDays ? calendarData.calendarDays[dateStr] : null,
    });
  }

  const selectedDayInfo = calendarData.calendarDays ? calendarData.calendarDays[selectedDateStr] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      {/* Calendar Grid Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', boxShadow: 'var(--shadow-card)' }}>
        {/* Day Name Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.75rem' }}>
          {dayNames.map((name) => (
            <div key={name} style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '0.5rem 0' }}>
              {name}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {days.map((item, idx) => {
            if (!item) {
              return <div key={`empty-${idx}`} style={{ minHeight: '64px' }} />;
            }

            const isSelected = selectedDateStr === item.dateStr;
            const isToday = todayDate === item.dateStr;
            const hasSpending = item.data && item.data.totalSpent > 0;

            return (
              <div
                key={item.dateStr}
                onClick={() => setSelectedDateStr(item.dateStr)}
                style={{
                  minHeight: '68px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid #0F172A' : isToday ? '1px solid var(--safe-primary)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(15, 23, 42, 0.04)' : '#FFFFFF',
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: isSelected || isToday ? 800 : 600,
                      color: isToday ? 'var(--safe-primary)' : 'var(--text-primary)',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isToday ? '#ECFDF5' : 'transparent',
                    }}
                  >
                    {item.day}
                  </span>
                  {hasSpending && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'inline-block',
                      }}
                    />
                  )}
                </div>

                {hasSpending ? (
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatCurrency(item.data.totalSpent)}
                  </div>
                ) : (
                  <div style={{ height: '14px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail Drawer / Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selected Date
            </span>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
              {formatFullDate(selectedDateStr)}
            </h3>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => openAddExpense(selectedDateStr)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          >
            <Plus size={15} />
            <span>Add Expense for Date</span>
          </button>
        </div>

        {selectedDayInfo && selectedDayInfo.expenses.length > 0 ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: '#F1F5F9', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Spent on this date:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {formatCurrency(selectedDayInfo.totalSpent)}
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {selectedDayInfo.expenses.map((exp) => (
                <div
                  key={exp._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{exp.category}</strong>
                    {exp.note && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{exp.note}</p>}
                  </div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(exp.amount)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No expenses logged for this date.
          </div>
        )}
      </div>
    </div>
  );
};
