import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { uploadImageToImgBB } from '../utils/imgbb';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Camera,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';

export const CARTOON_AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&hair=short01', // Male 1 (Short male haircut)
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&hair=short02', // Male 2 (Short male haircut)
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&hair=long01', // Female (Long hair)
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky', // Robot
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Buster', // Something Else (Fun Character)
];




export const AuthScreen = () => {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { showToast, triggerRefresh } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Forgot password flow
  const [forgotStep, setForgotStep] = useState(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [receivedCodeBanner, setReceivedCodeBanner] = useState('');
  const [emailSentStatus, setEmailSentStatus] = useState(false);


  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Handle local file image upload (with ImgBB support)
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file is too large. Please select an image under 5MB.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const res = await uploadImageToImgBB(file);
      if (res?.url) {
        setAvatarPreview(res.url);
      }
    } catch (err) {
      showToast('Failed to process photo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      showToast('Welcome back! Signed in successfully.');
      triggerRefresh();
    } catch (err) {
      showToast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, avatarPreview);
      showToast('Account created! Welcome to FinFood.');
      triggerRefresh();
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
          showToast('Verification email sent via Nodemailer!');
        } else {
          setReceivedCodeBanner(res.resetCode);
          setResetCode(res.resetCode);
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
      await resetPassword(email.trim(), resetCode.trim(), newPassword);
      showToast('Password reset successfully! Please sign in.');
      setMode('login');
      setPassword('');
      setForgotStep(1);
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="auth-fullscreen-container">
      <div className="auth-card">
        {/* Header Title & Subtitle */}
        <div className="auth-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 className="auth-title">
            {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create Account' : 'Reset password'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' && 'Access your food budget and expense tracker'}
            {mode === 'signup' && 'Start tracking your daily food expenses easily'}
            {mode === 'forgot' && 'Recover access to your FinFood account'}
          </p>
        </div>

        {/* ================= MODE: LOGIN ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            {/* Email Address */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Mail size={18} color="#94A3B8" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} color="#94A3B8" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="auth-forgot-row">
              <button
                type="button"
                className="auth-forgot-btn"
                onClick={() => {
                  setMode('forgot');
                  setError('');
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Login'}
            </button>

            {/* New user link placed at bottom as requested */}
            <div style={{ textAlign: 'center', marginTop: '1.35rem', fontSize: '0.88rem', color: '#64748B' }}>
              <span>New user? </span>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  color: '#10B981',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.88rem',
                }}
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE: SIGNUP ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            {/* Profile Image Uploader ("signup e img o chawa hbe") */}
            <div className="avatar-uploader-section">
              <div
                className="avatar-preview-circle"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile photo"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="avatar-preview-img" />
                ) : (
                  <div className="avatar-placeholder">
                    <Camera size={24} color="#64748B" />
                    <span>Photo</span>
                  </div>
                )}
                <div className="avatar-camera-badge">
                  <Camera size={12} color="#FFFFFF" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />

              <div className="avatar-presets-tray">
                <span className="avatar-presets-label">Choose avatar (2 Male, 1 Female, 1 Robot, 1 Fun Character) or upload photo:</span>
                <div className="avatar-presets-row">
                  {CARTOON_AVATAR_PRESETS.map((presetUrl, idx) => {
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
                        src={presetUrl}
                        alt={presetTitle}
                        title={presetTitle}
                        className={`preset-thumb ${avatarPreview === presetUrl ? 'selected' : ''}`}
                        onClick={() => setAvatarPreview(presetUrl)}
                      />
                    );
                  })}
                </div>
              </div>


            </div>

            {/* Full Name */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <User size={18} color="#94A3B8" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email Address */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Mail size={18} color="#94A3B8" />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} color="#94A3B8" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min 6 characters)"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <Lock size={18} color="#94A3B8" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.35rem', fontSize: '0.88rem', color: '#64748B' }}>
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  color: '#10B981',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.88rem',
                }}
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE: FORGOT PASSWORD ================= */}
        {mode === 'forgot' && (
          <div className="auth-form">
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Enter your email address to receive an instant verification reset code.
                </p>

                <div className="auth-input-group">
                  <div className="auth-input-icon">
                    <Mail size={18} color="#94A3B8" />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                  {isLoading ? 'Generating Code...' : 'Get Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {emailSentStatus ? (
                  <div className="reset-code-alert" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' }}>
                    <CheckCircle2 size={18} color="#059669" />
                    <span>A 6-digit code has been sent to <strong>{email}</strong> via Nodemailer. Please check your inbox.</span>
                  </div>
                ) : receivedCodeBanner ? (
                  <div className="reset-code-alert">
                    <KeyRound size={16} />
                    <span>Verification Code: <strong>{receivedCodeBanner}</strong></span>
                  </div>
                ) : null}


                <div className="auth-input-group">
                  <div className="auth-input-icon">
                    <KeyRound size={18} color="#94A3B8" />
                  </div>
                  <input
                    type="text"
                    placeholder="6-Digit Verification Code"
                    className="auth-input"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-input-group">
                  <div className="auth-input-icon">
                    <Lock size={18} color="#94A3B8" />
                  </div>
                  <input
                    type="password"
                    placeholder="New Password (min 6 chars)"
                    className="auth-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                  {isLoading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.35rem', fontSize: '0.88rem', color: '#64748B' }}>
              <span>Remember your password? </span>
              <button
                type="button"
                onClick={() => { setMode('login'); setForgotStep(1); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  color: '#10B981',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.88rem',
                }}
              >
                Back to sign in
              </button>
            </div>
          </div>
        )}



        {/* Footer Legal Terms */}
        <p className="auth-footer-notice">
          By signing in with an account, you agree to FinFood's{' '}
          <span className="auth-legal-link">Terms of Service</span> and{' '}
          <span className="auth-legal-link">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};
