import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, LockKeyhole, UserCheck, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Button, Field } from '../components/ui';

export default function CustomerAuth() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/checkout';
  const reason = searchParams.get('reason');
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const { customerSignIn, customerSignUp, customerUser } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpCity, setSignUpCity] = useState('');
  const [signUpState, setSignUpState] = useState('');
  const [signUpPincode, setSignUpPincode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError('Please enter both email address and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await customerSignIn(signInEmail, signInPassword);
      if (!res.success) {
        setError(res.message || 'Sign in failed. Please try again.');
        setLoading(false);
        return;
      }
      toast('Welcome back! You are now signed in.');
      navigate(redirect, { replace: true });
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setLoading(true);
    setSignInEmail('rahul@example.com');
    setSignInPassword('password123');
    try {
      const res = await customerSignIn('rahul@example.com', 'password123');
      if (res.success) {
        toast('Logged in as Rahul Patel (VIP Demo Customer)');
        navigate(redirect, { replace: true });
      }
    } catch {
      setError('Failed to login demo user.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPhone || !signUpPassword) {
      setError('Please complete all required fields (Name, Email, Mobile, Password).');
      return;
    }
    if (signUpPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await customerSignUp({
        name: signUpName,
        email: signUpEmail,
        phone: signUpPhone,
        password: signUpPassword,
        address: signUpAddress,
        city: signUpCity,
        state: signUpState,
        pincode: signUpPincode,
      });
      if (!res.success) {
        setError(res.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
      toast('Welcome to Aurel! Your account has been created.');
      navigate(redirect, { replace: true });
    } catch {
      setError('Something went wrong creating your account.');
      setLoading(false);
    }
  };

  if (customerUser) {
    return (
      <div className="commerce-page customer-auth-page">
        <div className="auth-card logged-in-card">
          <div className="success-mark"><UserCheck size={36} strokeWidth={1.2} /></div>
          <p className="eyebrow">ACCOUNT ACTIVE</p>
          <h1>Welcome back, <em>{customerUser.name.split(' ')[0]}</em></h1>
          <p className="auth-subtitle">You are signed in as <strong>{customerUser.email}</strong>.</p>
          <div className="auth-actions mt-6">
            <Button onClick={() => navigate(redirect)} className="w-full">
              CONTINUE TO CHECKOUT <ArrowRight size={16} />
            </Button>
            <Link to="/orders" className="text-link mt-4 inline-block">
              VIEW YOUR ORDERS & ACCOUNT DETAILS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="commerce-page customer-auth-page">
      <div className="breadcrumbs">
        <Link to="/">HOME</Link>
        <span>/</span>
        <Link to="/cart">BAG</Link>
        <span>/</span>
        <span>CUSTOMER AUTHENTICATION</span>
      </div>

      <div className="auth-container">
        {/* Notice banner when redirected from Checkout */}
        {(redirect.includes('checkout') || reason === 'order') && (
          <div className="checkout-gate-banner" role="alert">
            <LockKeyhole size={20} strokeWidth={1.4} />
            <div>
              <strong>CUSTOMER LOGIN REQUIRED TO PLACE AN ORDER</strong>
              <p>Please sign in or create an account to proceed with your shopping bag and place your order securely.</p>
            </div>
          </div>
        )}

        <div className="commerce-title text-center">
          <p className="eyebrow">JOIN THE AUREL ATELIER</p>
          <h1>
            Your <em>account.</em>
          </h1>
          <p>Sign in or create an account to manage your orders, saved pieces, and digital purchase cards.</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                setError('');
              }}
            >
              <UserCheck size={16} /> SIGN IN
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
            >
              <UserPlus size={16} /> CREATE ACCOUNT
            </button>
          </div>

          {error && <div className="form-error auth-error" role="alert">{error}</div>}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="auth-form">
              <p className="auth-form-intro">Access your Aurel account to complete your purchase.</p>

              <Field
                label="Email address"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
              />

              <Field
                label="Password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
              />

              <Button type="submit" loading={loading} className="w-full auth-submit">
                {loading ? 'SIGNING IN...' : 'SIGN IN & CONTINUE'} {!loading && <ArrowRight size={16} />}
              </Button>

              <div className="auth-divider">
                <span>OR FAST DEMO LOGIN</span>
              </div>

              <button
                type="button"
                className="button button-outline w-full demo-login-button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
              >
                <Sparkles size={16} /> DEMO LOGIN AS VIP CUSTOMER (RAHUL PATEL)
              </button>

              <p className="auth-footer-note">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  className="underlined text-gold"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                >
                  Create one now
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="auth-form">
              <p className="auth-form-intro">Create your account to unlock seamless ordering and digital certificates.</p>

              <div className="form-grid">
                <Field
                  className="form-full"
                  label="Full Name"
                  required
                  autoComplete="name"
                  placeholder="Rahul Patel"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                />

                <Field
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />

                <Field
                  label="Mobile Number"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                />

                <Field
                  className="form-full"
                  label="Account Password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />

                <div className="form-full auth-section-subheading">
                  <span>SHIPPING DETAILS (OPTIONAL FOR QUICK CHECKOUT)</span>
                </div>

                <Field
                  className="form-full"
                  label="Delivery address"
                  autoComplete="street-address"
                  placeholder="House, street, and area"
                  value={signUpAddress}
                  onChange={(e) => setSignUpAddress(e.target.value)}
                />

                <Field
                  label="City"
                  autoComplete="address-level2"
                  placeholder="Surat"
                  value={signUpCity}
                  onChange={(e) => setSignUpCity(e.target.value)}
                />

                <Field
                  label="State"
                  autoComplete="address-level1"
                  placeholder="Gujarat"
                  value={signUpState}
                  onChange={(e) => setSignUpState(e.target.value)}
                />

                <Field
                  label="Pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  placeholder="395009"
                  value={signUpPincode}
                  onChange={(e) => setSignUpPincode(e.target.value)}
                />
              </div>

              <Button type="submit" loading={loading} className="w-full auth-submit mt-4">
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & PROCEED'} {!loading && <ArrowRight size={16} />}
              </Button>

              <p className="auth-footer-note mt-4">
                Already registered?{' '}
                <button
                  type="button"
                  className="underlined text-gold"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                >
                  Sign in to your account
                </button>
              </p>
            </form>
          )}

          <div className="auth-security-badge">
            <ShieldCheck size={14} />
            <span>Encrypted local demo session. Your data is kept secure.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
