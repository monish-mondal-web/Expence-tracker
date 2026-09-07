import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User, KeyRound } from 'lucide-react';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    login,
    register,
    forgotPassword,
    resetPassword,
  } = useAuth();

  const { showToast, triggerRefresh } = useApp();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Forgot password flow
  const [forgotStep, setForgotStep] = useState(1); // 1: request code, 2: enter code & new pass
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [receivedCodeBanner, setReceivedCodeBanner] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      showToast('Welcome back! Signed in successfully.');
      triggerRefresh();
      closeAuthModal();
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      showToast('Account created successfully!');
      triggerRefresh();
      closeAuthModal();
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setEmailSentStatus(!!res.emailSent);
        if (res.emailSent) {
          setReceivedCodeBanner('');
          setResetCode('');
          showToast('Verification code sent to your email!');
        } else {
          setReceivedCodeBanner(res.resetCode);
          setResetCode(res.resetCode || '');
          showToast('Verification code generated!');
        }
        setForgotStep(2);
      }
    } catch (err) {
      showToast(err.message || 'Failed to request reset code.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await resetPassword(email.trim(), resetCode.trim(), newPassword);
      if (res.success) {
        showToast('Password updated! You can now sign in.');
        setAuthModalTab('login');
        setPassword(newPassword);
        setForgotStep(1);
        setReceivedCodeBanner('');
      }
    } catch (err) {
      showToast(err.message || 'Password reset failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {authModalTab === 'login' && 'Welcome to FinFood'}
              {authModalTab === 'register' && 'Create Your Account'}
              {authModalTab === 'forgot' && 'Reset Password'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {authModalTab === 'login' && 'Sign in to access your personal food budget'}
              {authModalTab === 'register' && 'Start tracking your monthly food expenses'}
              {authModalTab === 'forgot' && 'Recover access to your account'}
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeAuthModal}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        {authModalTab !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              background: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              marginBottom: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => { setAuthModalTab('login'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                background: authModalTab === 'login' ? '#FFFFFF' : 'transparent',
                borderRadius: 'calc(var(--radius-md) - 3px)',
                fontWeight: 600,
                fontSize: '0.86rem',
                color: authModalTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: authModalTab === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthModalTab('register'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                background: authModalTab === 'register' ? '#FFFFFF' : 'transparent',
                borderRadius: 'calc(var(--radius-md) - 3px)',
                fontWeight: 600,
                fontSize: '0.86rem',
                color: authModalTab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: authModalTab === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {authModalTab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <button
                  type="button"
                  onClick={() => { setAuthModalTab('forgot'); setError(''); setForgotStep(1); }}
                  style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: '#4F46E5', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 2. CREATE ACCOUNT FORM */}
        {authModalTab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password (minimum 6 characters)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FLOW */}
        {authModalTab === 'forgot' && (
          <div>
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest}>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Enter your registered email address to receive a 6-digit verification code.
                </p>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="form-input"
                      style={{ paddingLeft: '2.4rem' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Generating Code...' : 'Send Verification Code'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setAuthModalTab('login')}
                    style={{ background: 'none', border: 'none', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit}>
                {emailSentStatus ? (
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Verification Email Sent!</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      We emailed a 6-digit verification code to <strong>{email}</strong>. Please check your inbox.
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: '0.3rem' }}>Code valid for 15 minutes</div>
                  </div>
                ) : (
                  receivedCodeBanner && (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>Your Verification Code:</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.15em', margin: '0.2rem 0' }}>
                        {receivedCodeBanner}
                      </div>
                      <div style={{ fontSize: '0.72rem' }}>Code expires in 15 minutes</div>
                    </div>
                  )
                )}

                <div className="form-group">
                  <label className="form-label">6-Digit Code</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="123456"
                      className="form-input"
                      style={{ paddingLeft: '2.4rem', letterSpacing: '0.1em', fontWeight: 700 }}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="form-input"
                      style={{ paddingLeft: '2.4rem' }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Resetting Password...' : 'Update Password & Sign In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setError(''); }}
                    style={{ background: 'none', border: 'none', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    Request new code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
