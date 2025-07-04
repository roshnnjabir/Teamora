import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Simplified error extraction
function getErrorMessage(error) {
  return error?.response?.data?.detail || 
         error?.response?.data?.non_field_errors?.[0] || 
         error?.message || 
         'Something went wrong';
}

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateSubdomain = (subdomain) => /^[a-z0-9-]+$/.test(subdomain);

// OTP Modal Component
function OtpModal({ visible, onClose, email, onVerified }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!otp.trim()) return setError('Please enter OTP');
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${BASE_URL}/api/tenants/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Verification failed');
      }

      onVerified();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Reset on open/close
  useEffect(() => {
    if (visible) {
      setOtp('');
      setError('');
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-xl font-semibold mb-2">Verify Email</h2>
        <p className="text-gray-600 text-sm mb-4">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>

        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(value);
            if (error) setError('');
          }}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-2"
          maxLength={6}
        />

        {error && (
          <p className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function TenantSignup() {
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    email: '',
    fullName: '',
    password: ''
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const navigate = useNavigate();

  const steps = [
    { title: 'Company Details', fields: ['tenantName', 'subdomain'] },
    { title: 'Admin Account', fields: ['fullName', 'email', 'password'] }
  ];

  // Clear messages when input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'subdomain' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '') : value
    }));
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Validate current step
  const validateCurrentStep = () => {
    const currentFields = steps[currentStep].fields;
    const emptyFields = currentFields.filter(field => !formData[field].trim());
    
    if (emptyFields.length > 0) {
      setError('Please fill in all required fields');
      return false;
    }

    if (currentStep === 0) {
      if (!validateSubdomain(formData.subdomain)) {
        setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
        return false;
      }
    }

    if (currentStep === 1) {
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSendOtp = async () => {
    if (!validateEmail(formData.email)) {
      return setError('Please enter a valid email address');
    }

    setSendingOtp(true);
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/api/tenants/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to send OTP');
      }

      setOtpModalVisible(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;
    if (!emailVerified) {
      setError('Please verify your email before submitting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        tenant_name: formData.tenantName,
        domain_url: `${formData.subdomain}.localhost`,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
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

      setSuccess(`Workspace created successfully! Login link sent to ${formData.email}`);
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Workspace</h1>
          <p className="text-gray-600">Set up your organization in just a few steps</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Progress Bar */}
          <div className="px-8 pt-8">
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                    index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className={`text-sm font-medium ${
                      index <= currentStep ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full ${
                      index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
            
          {/* Form Content */}
          <div className="px-8 pb-8">
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.tenantName}
                    onChange={(e) => handleInputChange('tenantName', e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white/50"
                    required
                  />
                </div>
            
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.subdomain}
                      onChange={(e) => handleInputChange('subdomain', e.target.value)}
                      placeholder="acme"
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white/50"
                      required
                    />
                    <span className="text-gray-500 font-medium">.localhost</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white/50"
                    required
                  />
                </div>
            
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="admin@company.com"
                      disabled={emailVerified}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white/50 disabled:bg-gray-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={!formData.email || emailVerified || sendingOtp}
                      className={`px-4 py-3 rounded-xl font-medium text-white ${
                        emailVerified 
                          ? 'bg-green-500 cursor-default' 
                          : !formData.email || sendingOtp
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {sendingOtp ? 'Sending...' : emailVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                </div>
                    
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-white/50"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* Messages */}
            {error && (
              <p className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                {success}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-xl font-medium ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !emailVerified}
                  className={`px-8 py-3 rounded-xl font-medium shadow-lg text-white ${
                    loading || !emailVerified
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Workspace'
                  )}
                </button>
              )}
            </div>
          </div> {/* Close form content */}
        </div> {/* Close card */}
            
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div> {/* Close max-w-2xl */}
            
      {/* OTP Modal */}
      <OtpModal
        visible={otpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        email={formData.email}
        onVerified={() => {
          setEmailVerified(true);
          setSuccess('Email verified successfully!');
        }}
      />
    </div>
  );
}