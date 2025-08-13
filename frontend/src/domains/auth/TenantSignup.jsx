import { useState, useEffect, useReducer, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RATE_LIMITS = {
  OTP_COOLDOWN: 60000, // 1 minute
  MAX_OTP_ATTEMPTS: 3,
  MAX_VERIFICATION_ATTEMPTS: 5,
  SUBDOMAIN_CHECK_DEBOUNCE: 500,
};

// Validation and error utils
const getErrorMessage = (error) => {
  if (error?.response?.status === 429) {
    return 'Too many requests. Please wait before trying again.';
  }
  return error?.response?.data?.detail ||
         error?.response?.data?.non_field_errors?.[0] ||
         error?.message ||
         'Something went wrong. Please try again.';
};

const validateEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

const validateSubdomain = (subdomain) =>
  /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(subdomain) && !subdomain.includes('--');

const validateTenantName = (name) => {
  const trimmed = name.trim();
  const errors = [];

  if (!trimmed) {
    errors.push('Organization name is required');
  }
  if (trimmed.length < 3) {
    errors.push('At least 3 characters required');
  }
  if (trimmed.length > 63) {
    errors.push('Cannot exceed 63 characters');
  }
  if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
    errors.push('Only letters, numbers, and spaces allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validatePassword = (password) => {
  return {
    isValid:
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password),
    errors: [
      password.length < 8 && 'At least 8 characters',
      !/[A-Z]/.test(password) && 'One uppercase letter',
      !/[a-z]/.test(password) && 'One lowercase letter',
      !/\d/.test(password) && 'One number',
    ].filter(Boolean),
  };
};

// Initial reducer state
const initialState = {
  formData: {
    tenantName: '',
    subdomain: '',
    email: '',
    fullName: '',
    password: '',
  },
  currentStep: 0,
  errors: {},
  success: '',
  emailVerified: false,
  showOtpSection: false,
  otp: '',
  otpAttempts: 0,
  otpVerificationAttempts: 0,
  lastOtpSent: null,
  subdomainChecking: false,
  subdomainAvailable: null,
  tenantNameAvailable: null,
  dashboardCreated: false,

  otpLoading: false,
  signupLoading: false,

  touched: {
    email: false,
    tenantName: false,
    subdomain: false,
    fullName: false,
    password: false,
    otp: false,
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: null },
      };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };
    case 'SET_OTP_LOADING':
      return { ...state, otpLoading: action.value };
    case 'SET_SIGNUP_LOADING':
      return { ...state, signupLoading: action.value };
    case 'SET_SUCCESS':
      return { ...state, success: action.message };
    case 'SET_STEP':
      return { ...state, currentStep: action.step, errors: {} };
    case 'SET_EMAIL_VERIFIED':
      return { ...state, emailVerified: true, showOtpSection: false };
    case 'SHOW_OTP_SECTION':
      return { ...state, showOtpSection: true, lastOtpSent: Date.now(), otp: '' };
    case 'UPDATE_OTP':
      return { ...state, otp: action.value };
    case 'INCREMENT_OTP_ATTEMPTS':
      return { ...state, otpAttempts: state.otpAttempts + 1 };
    case 'INCREMENT_OTP_VERIFY_ATTEMPTS':
      return {
        ...state,
        otpVerificationAttempts: action.value !== undefined
          ? action.value
          : state.otpVerificationAttempts + 1,
      };
    case "SET_DASHBOARD_CREATED":
      return { ...state, dashboardCreated: action.value };
    case 'SET_SUBDOMAIN_CHECKING':
      return { ...state, subdomainChecking: action.value };
    case 'SET_SUBDOMAIN_AVAILABLE':
      return { ...state, subdomainAvailable: action.value };
    case 'SET_TENANT_NAME_AVAILABLE':
      return { ...state, tenantNameAvailable: action.value };
    case 'SET_TOUCHED':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };
    default:
      return state;
  }
};

export default function TenantSignup() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState([]);
  const subdomainTimeoutRef = useRef();
  const otpInputRef = useRef();
  const navigate = useNavigate();

  const steps = [
    { title: 'Company Details', fields: ['tenantName', 'subdomain'] },
    { title: 'Admin Account', fields: ['fullName', 'email', 'password'] },
  ];

  // Autofocus on OTP input
  useEffect(() => {
    if (state.showOtpSection && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [state.showOtpSection]);

  // Subdomain check debounce
  useEffect(() => {
    if (state.formData.subdomain.length < 3 || state.formData.tenantName.trim().length === 0) return;

    clearTimeout(subdomainTimeoutRef.current);
    subdomainTimeoutRef.current = setTimeout(checkSubdomainAvailability, RATE_LIMITS.SUBDOMAIN_CHECK_DEBOUNCE);

    return () => clearTimeout(subdomainTimeoutRef.current);
  }, [state.formData.subdomain, state.formData.tenantName]);

  // OTP cooldown countdown
  useEffect(() => {
    if (!state.lastOtpSent) return;
    const interval = setInterval(() => {
      const remaining = RATE_LIMITS.OTP_COOLDOWN - (Date.now() - state.lastOtpSent);
      setOtpCooldown(Math.max(0, Math.ceil(remaining / 1000)));
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.lastOtpSent]);

  const handleInputChange = (field, value) => {
    let processed = value;
    if (field === 'subdomain') processed = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 63);
    if (field === 'email') processed = value.trim().toLowerCase();
    if (field === 'otp') processed = value.replace(/\D/g, '').slice(0, 6);

    dispatch({
      type: field === 'otp' ? 'UPDATE_OTP' : 'UPDATE_FIELD',
      field,
      value: processed,
    });

    if (field === 'email') {
      dispatch({ type: 'SET_TOUCHED', field });
    }

    if (field === 'password') {
      setPasswordConfirmed(false);
      if (value === '') {
        setPasswordFeedback([]);
        dispatch({ type: 'SET_ERROR', field: 'password', error: null });
        return;
      }
    
      const pwdCheck = validatePassword(value);
      if (!pwdCheck.isValid) {
        dispatch({
          type: 'SET_ERROR',
          field: 'password',
          error: pwdCheck.isValid ? null : pwdCheck.errors.join(', ')
        });

        setPasswordFeedback(pwdCheck.errors);
      } else {
        dispatch({
          type: 'SET_ERROR',
          field: 'password',
          error: null,
        });
        setPasswordFeedback([]);
      }
    }

    dispatch({ type: 'SET_SUCCESS', message: '' });
  };

  const validateCurrentStep = () => {
    const fields = steps[state.currentStep].fields;
    let valid = true;

    fields.forEach((field) => {
      if (!state.formData[field].trim()) {
        dispatch({ type: 'SET_ERROR', field, error: 'This field is required' });
        valid = false;
      }
    });

    if (state.currentStep === 0) {
      const tenantValidation = validateTenantName(state.formData.tenantName);
      if (!tenantValidation.isValid) {
        dispatch({ type: 'SET_ERROR', field: 'tenantName', error: tenantValidation.errors.join(', ') });
        valid = false;
      } else if (state.tenantNameAvailable === false) {
        dispatch({ type: 'SET_ERROR', field: 'tenantName', error: 'Organization name already taken' });
        valid = false;
      } 

      if (!validateSubdomain(state.formData.subdomain)) {
        dispatch({ type: 'SET_ERROR', field: 'subdomain', error: 'Invalid subdomain format' });
        valid = false;
      } else if (state.subdomainAvailable === false) {
        dispatch({ type: 'SET_ERROR', field: 'subdomain', error: 'Subdomain not available' });
        valid = false;
      }
    }

    if (state.currentStep === 1) {
      if (!validateEmail(state.formData.email)) {
        dispatch({ type: 'SET_ERROR', field: 'email', error: 'Invalid email format' });
        valid = false;
      }

      const pwdCheck = validatePassword(state.formData.password);
      if (!pwdCheck.isValid) {
        dispatch({ type: 'SET_ERROR', field: 'password', error: pwdCheck.errors.join(', ') });
        valid = false;
      }
    }

    return valid;
  };

  const checkSubdomainAvailability = async () => {
    if (!validateSubdomain(state.formData.subdomain)) {
      dispatch({ type: 'SET_SUBDOMAIN_AVAILABLE', value: false });
      return;
    }

    dispatch({ type: 'SET_SUBDOMAIN_CHECKING', value: true });
    try {
      const res = await fetch(`${BASE_URL}/api/tenants/check-availability/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: `${state.formData.subdomain}.${import.meta.env.VITE_ROOT_DOMAIN}`,
          tenant_name: state.formData.tenantName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // backend error → show in field
        dispatch({ type: 'SET_ERROR', field: 'subdomain', error: data.detail || 'Invalid subdomain' });
        dispatch({ type: 'SET_SUBDOMAIN_AVAILABLE', value: false });
      } else {
        dispatch({ type: 'SET_SUBDOMAIN_AVAILABLE', value: data.subdomain_available });
        dispatch({ type: 'SET_TENANT_NAME_AVAILABLE', value: data.tenant_name_available });
        // Set error if subdomain is not available
        if (data.subdomain_available === false) {
          dispatch({ type: 'SET_ERROR', field: 'subdomain', error: 'Subdomain not available' });
        }
        // Set error if tenant name is not available
        if (data.tenant_name_available === false) {
          dispatch({ type: 'SET_ERROR', field: 'tenantName', error: 'Organization name already taken' });
        }
      }
    } catch {
      dispatch({ type: 'SET_SUBDOMAIN_AVAILABLE', value: false });
      dispatch({ type: 'SET_TENANT_NAME_AVAILABLE', value: false });
    } finally {
      dispatch({ type: 'SET_SUBDOMAIN_CHECKING', value: false });
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    dispatch({ type: 'SET_STEP', step: state.currentStep + 1 });
  };

  const handlePrevious = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_STEP', step: state.currentStep - 1 });
    }
  };

  const canSendOtp = () => {
    const cooldownOver = !state.lastOtpSent || Date.now() - state.lastOtpSent > RATE_LIMITS.OTP_COOLDOWN;
    return cooldownOver && state.otpAttempts < RATE_LIMITS.MAX_OTP_ATTEMPTS && validateEmail(state.formData.email);
  };

  const handleSendOtp = async () => {
    if (!canSendOtp()) return;

      // Clear email error if user edits the field (enables button again)
      if (state.errors.email) {
        dispatch({ type: 'SET_ERROR', field: 'email', error: null });
      }
    dispatch({ type: 'CLEAR_ERRORS' });

    try {
      const res = await fetch(`${BASE_URL}/api/tenants/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.formData.email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to send OTP');
      }

      dispatch({ type: 'SHOW_OTP_SECTION' });
      dispatch({ type: 'SET_SUCCESS', message: 'OTP sent successfully!' });
      dispatch({ type: 'INCREMENT_OTP_ATTEMPTS' });

      dispatch({ type: 'UPDATE_OTP', field: 'otp', value: '' });
      dispatch({ type: 'INCREMENT_OTP_VERIFY_ATTEMPTS', value: 0 });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', field: 'email', error: getErrorMessage(error) });
      dispatch({ type: 'INCREMENT_OTP_ATTEMPTS' });
    } finally {
      dispatch({ type: 'SET_OTP_LOADING', value: false });
    }
  };

  const handleVerifyOtp = async () => {
    if (state.otp.length !== 6) {
      dispatch({ type: 'SET_ERROR', field: 'otp', error: 'Enter 6-digit code' });
      return;
    }

    if (state.otpVerificationAttempts >= RATE_LIMITS.MAX_VERIFICATION_ATTEMPTS) {
      dispatch({ type: 'SET_ERROR', field: 'otp', error: 'Too many attempts. Please resend code.' });
      return;
    }

    dispatch({ type: 'SET_OTP_LOADING', value: true });

    try {
      const res = await fetch(`${BASE_URL}/api/tenants/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.formData.email, otp: state.otp }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'OTP verification failed');
      }

      dispatch({ type: 'SET_EMAIL_VERIFIED' });
      dispatch({ type: 'SET_SUCCESS', message: 'Email verified successfully!' });
    } catch (error) {
      dispatch({ type: 'INCREMENT_OTP_VERIFY_ATTEMPTS' });
      dispatch({ type: 'SET_ERROR', field: 'otp', error: getErrorMessage(error) });
    } finally {
      dispatch({ type: 'SET_OTP_LOADING', value: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep() || !state.emailVerified) {
      if (!state.emailVerified) {
        dispatch({ type: 'SET_ERROR', field: 'email', error: 'Please verify your email' });
      }
      return;
    }

    dispatch({ type: 'SET_SIGNUP_LOADING', value: true });
    dispatch({ type: 'CLEAR_ERRORS' });

    try {
      const payload = {
        tenant_name: state.formData.tenantName,
        domain_url: `${state.formData.subdomain}.${import.meta.env.VITE_ROOT_DOMAIN}`,
        email: state.formData.email,
        password: state.formData.password,
        full_name: state.formData.fullName,
      };

      const res = await fetch(`${BASE_URL}/api/tenants/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Signup failed');
      }

      dispatch({
        type: 'SET_SUCCESS',
        message: `Workspace created! Login link sent to ${state.formData.email}`,
      });
      dispatch({ type: 'SET_DASHBOARD_CREATED', value: true });

      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', field: 'general', error: getErrorMessage(error) });
    } finally {
      dispatch({ type: 'SET_SIGNUP_LOADING', value: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1); // go back if history exists
            } else {
              navigate('/'); // fallback to home
            }
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg hover:scale-105 transition-transform"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Workspace
          </h1>
          <p className="text-gray-600">
            Set up your organization in just a few steps
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Progress Bar */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-200 ${
                      index <= state.currentStep
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < state.currentStep ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div
                      className={`text-sm font-medium transition-colors ${
                        index <= state.currentStep ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${
                        index < state.currentStep
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            
            {/* Move Back Button Here */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-8 pb-8">
            {state.currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={state.formData.tenantName}
                      onChange={(e) => handleInputChange('tenantName', e.target.value)}
                      placeholder="e.g., Acme Corporation"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white/70 ${
                        state.errors.tenantName 
                          ? 'border-red-300 focus:border-red-500' 
                          : state.tenantNameAvailable === true
                            ? 'border-green-300 focus:border-green-500'
                            : 'border-gray-200 focus:border-blue-500'
                      } pr-12`}
                      autoFocus
                    />
                    {/* Visual feedback for org name availability */}
                    {state.subdomainChecking && (
                      <div className="absolute right-3 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {!state.subdomainChecking && state.tenantNameAvailable === true && (
                      <div className="absolute right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {!state.subdomainChecking && state.tenantNameAvailable === false && (
                      <div className="absolute right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.225 4.811a1 1 0 011.414 0L10 7.172l2.361-2.361a1 1 0 111.414 1.414L11.414 8.586l2.361 2.361a1 1 0 01-1.414 1.414L10 10l-2.361 2.361a1 1 0 01-1.414-1.414L8.586 8.586 6.225 6.225a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {state.errors.tenantName && (
                    <p className="mt-2 text-sm text-red-600">{state.errors.tenantName}</p>
                  )}
                </div>
            
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subdomain *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={state.formData.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value)}
                      placeholder="acme"
                      className={`flex-1 px-4 py-3 rounded-l-xl border-2 border-r-0 transition-all duration-200 focus:outline-none bg-white/70 ${
                        state.errors.subdomain 
                          ? 'border-red-300 focus:border-red-500' 
                          : state.subdomainAvailable === true
                            ? 'border-green-300 focus:border-green-500'
                            : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    <div className="px-4 py-3 bg-gray-100 border-2 border-l-0 border-gray-200 rounded-r-xl text-gray-600 font-medium">
                      .teamora.com
                    </div>
                    {state.subdomainChecking && (
                      <div className="ml-2 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {state.subdomainAvailable === true && (
                      <div className="ml-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {state.subdomainAvailable === false && (
                      <div className="ml-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.225 4.811a1 1 0 011.414 0L10 7.172l2.361-2.361a1 1 0 111.414 1.414L11.414 8.586l2.361 2.361a1 1 0 01-1.414 1.414L10 10l-2.361 2.361a1 1 0 01-1.414-1.414L8.586 8.586 6.225 6.225a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Lowercase letters, numbers, and hyphens only (3-63 characters)
                  </p>
                  {state.errors.subdomain && (
                    <p className="mt-2 text-sm text-red-600">{state.errors.subdomain}</p>
                  )}
                </div>
              </div>
            )}

            {state.currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    value={state.formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white/70 ${
                      state.errors.fullName 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    autoFocus
                  />
                  {state.errors.fullName && (
                    <p className="mt-2 text-sm text-red-600">{state.errors.fullName}</p>
                  )}
                </div>
            
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={state.formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="admin@company.com"
                      disabled={state.emailVerified}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                        state.emailVerified 
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : state.errors.email 
                            ? 'border-red-300 focus:border-red-500 bg-white/70' 
                            : 'border-gray-200 focus:border-blue-500 bg-white/70'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={state.emailVerified || !canSendOtp() || state.otpLoading}
                      className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 min-w-[120px] ${
                        state.emailVerified
                          ? 'bg-green-400 cursor-not-allowed shadow-lg'
                          : !canSendOtp() || state.otpLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {state.otpLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : state.emailVerified ? (
                        'Verified ✓'
                      ) : otpCooldown  > 0 ? (
                        `Wait ${otpCooldown}s`
                      ) : (
                        'Send Code'
                      )}
                    </button>
                  </div>
                  {state.touched.email && !state.emailVerified && state.formData.email && !validateEmail(state.formData.email) ? (
                    <p className="mt-2 text-sm text-red-600">Enter a valid email.</p>
                  ) : state.errors.email ? (
                    <p className="mt-2 text-sm text-red-600">{state.errors.email}</p>
                  ) : null}

                  {/* OTP Section - Visible/Invisible based on state */}
                  {state.showOtpSection && !state.emailVerified && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter Verification Code
                      </label>
                      <div className="flex gap-3">
                        <input
                          ref={otpInputRef}
                          type="text"
                          value={state.otp}
                          onChange={(e) => handleInputChange('otp', e.target.value)}
                          placeholder="6-digit code"
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white ${
                            state.errors.otp 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-gray-200 focus:border-blue-500'
                          }`}
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={state.otpLoading || state.otp.length !== 6}
                          className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                            state.otpLoading || state.otp.length !== 6
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {state.otpLoading ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                      {state.errors.otp && (
                        <p className="mt-2 text-sm text-red-600">{state.errors.otp}</p>
                      )}
                      <p className="text-xs text-gray-600 mt-2">
                        Code sent to {state.formData.email}
                      </p>
                    </div>
                  )}
                </div>
                    
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={state.formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Strong password required"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none bg-white/70 ${
                        state.errors.password 
                          ? 'border-red-300 focus:border-red-500' 
                          : 'border-gray-200 focus:border-blue-500'
                      } ${passwordConfirmed ? 'pr-16' : 'pr-12'}`}
                      disabled={passwordConfirmed}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-2.364A9.956 9.956 0 0021.9 12c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.364-.964M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.5 0c0 5.523-4.477 10-10 10S2.5 17.523 2.5 12 6.977 2 12.5 2s10 4.477 10 10z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        if (passwordConfirmed) {
                          setPasswordConfirmed(false); // Unlock for editing
                        } else if (state.formData.password && !state.errors.password) {
                          setPasswordConfirmed(true);
                        }
                      }}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700 focus:outline-none transition ${passwordConfirmed ? 'opacity-100' : 'opacity-80'}`}
                      aria-label={passwordConfirmed ? "Edit password" : "Confirm password"}
                      disabled={!state.formData.password || passwordFeedback.length > 0}
                    >
                      {passwordConfirmed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                        </svg>
                      )}
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap z-10">
                      {passwordConfirmed
                        ? "Click to edit your password"
                        : "Click to confirm your password"}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {passwordConfirmed ? (
                      <span className="text-green-600 font-semibold">Password confirmed! You can now continue.</span>
                    ) : (
                      <>
                        Enter your password and click the <span className="inline-block align-middle"><svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg></span> icon to confirm.
                      </>
                    )}
                  </p>
                  {/* Password feedback */}
                  <div className="mt-2 text-sm space-y-1">
                    {passwordFeedback.length > 0 ? (
                      <ul className="text-red-600 list-disc list-inside">
                        {passwordFeedback.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    ) : (
                      state.formData.password && (
                        <p className="text-green-600 font-medium">✅ Strong password!</p>
                      )
                    )}
                  </div>

                  <p className="mt-1 text-xs text-gray-500 italic">
                    {passwordConfirmed
                      ? "🔓 Password confirmed. Click the green checkmark again to edit if needed."
                      : "🔒 Once your password meets all requirements, click the green checkmark to confirm it."}
                  </p>
                </div>
              </div>
            )}

            {/* General Messages */}
            {state.errors.general && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {state.errors.general}
              </div>
            )}

            {state.success && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                {state.success}
              </div>
            )}

            {state.signupLoading && (
              <div className="mb-4 p-4 bg-teal-100 text-teal-800 rounded-lg flex items-center gap-3">
                <div
                  className="w-5 h-5 border-2 border-t-2 border-b-2 border-teal-500 rounded-full animate-spin"
                ></div>
                <span>
                  Your workspace is being created! You’ll receive an email shortly with your login details.
                </span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={state.currentStep === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  state.currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              
              {state.currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:from-blue-600 hover:to-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={state.signupLoading || !state.emailVerified || !passwordConfirmed || state.dashboardCreated}
                  className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 text-white ${
                    state.signupLoading || !state.emailVerified || !passwordConfirmed || state.dashboardCreated
                      ? 'bg-gray-400 cursor-not-allowed'
                      : state.dashboardCreated
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:from-green-600 hover:to-emerald-700'
                  }`}
                >
                  {state.signupLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : state.dashboardCreated ? (
                    'Workspace Created!'
                  ) : (
                    'Create Workspace'
                  )}
                </button>

              )}
            </div>
          </form>
        </div>
            
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Already have an account but forgot your workspace?{' '}
            <button 
              onClick={() => navigate('/accessyourworkspace')}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Access your workspace
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}