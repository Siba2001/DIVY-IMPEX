import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DivyLogo from '../../components/common/DivyLogo';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  Shield,
  Key,
  User,
  Lock,
  UserPlus,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Users,
  ShieldCheck,
  Edit3,
  ChevronRight
} from 'lucide-react';

const AdminCredentials = () => {
  const {
    user,
    users,
    createUser,
    changeUserPassword,
    changeUserId,
    deleteUser,
    verifyAdminMasterKey
  } = useAuth();

  const navigate = useNavigate();

  // Authentication gate for /admin
  const isAdminLoggedIn = user && user.role === 'admin';
  const [isUnlocked, setIsUnlocked] = useState(isAdminLoggedIn);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [showMasterKey, setShowMasterKey] = useState(false);

  // Active Tab: Default to "change-password" as requested ("open the change password")
  const [activeTab, setActiveTab] = useState('change-password'); // 'change-password' | 'create-user' | 'user-list'

  // Change Password State
  const [selectedUserForReset, setSelectedUserForReset] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  // Create User State
  const [newUsername, setNewUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPass, setCreateConfirmPass] = useState('');
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('worker');
  const [email, setEmail] = useState('');
  const [createMsg, setCreateMsg] = useState({ type: '', text: '' });

  // Rename User ID State (Modal/Inline)
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUserIdVal, setNewUserIdVal] = useState('');
  const [renameMsg, setRenameMsg] = useState({ type: '', text: '' });
  const [userToDelete, setUserToDelete] = useState(null);

  const [checkingKey, setCheckingKey] = useState(false);

  // Master Key / Admin Password verification submit
  const handleUnlockGate = async (e) => {
    e.preventDefault();
    setGateError('');
    const trimmed = masterKeyInput.trim();
    if (!trimmed) {
      setGateError('Please enter the Master Security Key or Admin Password.');
      return;
    }

    setCheckingKey(true);
    try {
      const isValid = await verifyAdminMasterKey(trimmed);
      setCheckingKey(false);
      if (isValid) {
        setIsUnlocked(true);
        setGateError('');
      } else {
        setGateError('Invalid Security Key or Admin Password! Access denied.');
      }
    } catch {
      setCheckingKey(false);
      setGateError('Verification failed. Please check network connection.');
    }
  };

  const [submitting, setSubmitting] = useState(false);

  // Submit Password Change
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    if (!selectedUserForReset) {
      setPwdMsg({ type: 'danger', text: 'Please select a User ID from the list.' });
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPwdMsg({ type: 'danger', text: 'Password must be at least 4 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'danger', text: 'Passwords do not match!' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeUserPassword(selectedUserForReset, newPassword);
      setSubmitting(false);
      if (res.success) {
        setPwdMsg({ type: 'success', text: res.message });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ type: 'danger', text: res.message });
      }
    } catch (err) {
      setSubmitting(false);
      setPwdMsg({ type: 'danger', text: err.message || 'Error updating password in database.' });
    }
  };

  // Submit User Creation
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateMsg({ type: '', text: '' });

    if (!newUsername.trim()) {
      setCreateMsg({ type: 'danger', text: 'User ID is required.' });
      return;
    }
    if (!createPassword || createPassword.length < 4) {
      setCreateMsg({ type: 'danger', text: 'Password must be at least 4 characters.' });
      return;
    }
    if (createPassword !== createConfirmPass) {
      setCreateMsg({ type: 'danger', text: 'Passwords do not match!' });
      return;
    }
    if (!fullName.trim()) {
      setCreateMsg({ type: 'danger', text: 'Full Name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createUser({
        username: newUsername,
        password: createPassword,
        name: fullName,
        role,
        email
      });

      setSubmitting(false);
      if (res.success) {
        setCreateMsg({ type: 'success', text: res.message });
        setNewUsername('');
        setCreatePassword('');
        setCreateConfirmPass('');
        setFullName('');
        setEmail('');
        setRole('worker');
      } else {
        setCreateMsg({ type: 'danger', text: res.message });
      }
    } catch (err) {
      setSubmitting(false);
      setCreateMsg({ type: 'danger', text: err.message || 'Error creating user in database.' });
    }
  };

  // Rename User ID
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    setRenameMsg({ type: '', text: '' });
    if (!newUserIdVal.trim()) {
      setRenameMsg({ type: 'danger', text: 'New User ID cannot be empty.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeUserId(editingUserId, newUserIdVal);
      setSubmitting(false);
      if (res.success) {
        setRenameMsg({ type: 'success', text: res.message });
        setTimeout(() => {
          setEditingUserId(null);
          setNewUserIdVal('');
          setRenameMsg({ type: '', text: '' });
        }, 1500);
      } else {
        setRenameMsg({ type: 'danger', text: res.message });
      }
    } catch (err) {
      setSubmitting(false);
      setRenameMsg({ type: 'danger', text: err.message || 'Error changing User ID in database.' });
    }
  };

  // Delete User with confirmation
  const handleDelete = (uname) => {
    setUserToDelete(uname);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setSubmitting(true);
    try {
      const res = await deleteUser(userToDelete);
      setSubmitting(false);
      const targetUser = userToDelete;
      setUserToDelete(null);
      if (selectedUserForReset === targetUser) {
        setSelectedUserForReset('');
      }
      if (!res.success) {
        alert(res.message);
      }
    } catch (err) {
      setSubmitting(false);
      alert(err.message || 'Error deleting user from database.');
    }
  };

  // Quick jump to password reset from user list
  const triggerPasswordResetForUser = (uname) => {
    setSelectedUserForReset(uname);
    setActiveTab('change-password');
    setPwdMsg({ type: '', text: '' });
  };

  // =========================================================================
  // VIEW 1: LOCKED SECURITY GATE (If not verified)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div
        className="min-vh-100 bg-diamond-pattern d-flex align-items-center justify-content-center p-3"
        style={{ backgroundColor: '#071224' }}
      >
        <div
          className="card border-0 shadow-2xl rounded-4 overflow-hidden"
          style={{ maxWidth: '440px', width: '100%', background: '#FFFFFF' }}
        >
          {/* Header */}
          <div
            className="p-4 text-center text-white"
            style={{
              background: 'linear-gradient(135deg, #0A192F 0%, #112240 100%)',
              borderBottom: '2px solid #D4AF37'
            }}
          >
            <div className="d-inline-flex p-3 rounded-circle bg-navy border border-gold mb-3 shadow">
              <Shield className="text-gold" size={36} />
            </div>
            <h4 className="font-heading fw-bold mb-1" style={{ color: '#D4AF37' }}>
              Admin Security Portal
            </h4>
            <p className="small text-slate-300 mb-0" style={{ color: '#94A3B8' }}>
              Master Credential & Password Management Gate
            </p>
          </div>

          {/* Form */}
          <div className="card-body p-4">
            <div className="alert alert-warning small py-2 px-3 rounded-3 mb-3 border-warning d-flex align-items-center">
              <Key size={16} className="me-2 text-warning flex-shrink-0" />
              <div>Enter your <strong>Master Security Token</strong> or <strong>Admin Password</strong> to proceed.</div>
            </div>

            {gateError && (
              <div className="alert alert-danger d-flex align-items-center small p-3 rounded-3 mb-3" role="alert">
                <AlertCircle size={18} className="me-2 flex-shrink-0" />
                <div>{gateError}</div>
              </div>
            )}

            <form onSubmit={handleUnlockGate}>
              <div className="mb-4">
                <label className="form-label fw-semibold text-secondary small">
                  Master Security Key / Admin Password
                </label>
                <div className="position-relative">
                  <Lock size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type={showMasterKey ? 'text' : 'password'}
                    className="form-control ps-5 pe-5 font-mono"
                    placeholder="Enter security key..."
                    value={masterKeyInput}
                    onChange={(e) => setMasterKeyInput(e.target.value)}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                    onClick={() => setShowMasterKey(!showMasterKey)}
                  >
                    {showMasterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkingKey}
                className="btn btn-gold w-100 rounded-pill py-2 font-heading fw-bold d-flex align-items-center justify-content-center shadow-sm mb-3"
              >
                {checkingKey ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                ) : (
                  <ShieldCheck size={18} className="me-2" />
                )}
                {checkingKey ? 'Verifying...' : 'Authenticate & Access Admin Portal'}
              </button>
            </form>

            <Link
              to="/login"
              className="btn btn-outline-secondary w-100 rounded-pill py-2 font-heading fw-medium small d-flex align-items-center justify-content-center"
            >
              <ArrowLeft size={16} className="me-2" /> Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNLOCKED MASTER CREDENTIAL CONTROL PANEL
  // =========================================================================
  return (
    <div className="min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Top Admin Header Bar */}
      <header
        className="text-white py-3 px-4 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #0A192F 0%, #112240 100%)',
          borderBottom: '2px solid #D4AF37'
        }}
      >
        <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <DivyLogo stacked={false} iconSize={38} textClassName="fs-5 text-white" />
            <div className="border-start ps-3 border-secondary d-none d-sm-block">
              <span className="badge bg-gold text-navy fw-bold text-uppercase px-2 py-1">
                Admin Control Panel
              </span>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                User ID & Password Management
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Link to="/dashboard" className="btn btn-sm btn-outline-light rounded-pill px-3">
              Dashboard
            </Link>
            <Link to="/login" className="btn btn-sm btn-outline-warning rounded-pill px-3">
              Login Screen
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container py-4">
        {/* Navigation Tabs */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-body p-2 bg-white">
            <div className="nav nav-pills nav-fill gap-2" role="tablist">
              <button
                type="button"
                className={`nav-link rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'change-password' ? 'active bg-navy text-white shadow-sm' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('change-password')}
              >
                <Key size={18} className={activeTab === 'change-password' ? 'text-gold' : ''} />
                <span>1. Change / Reset Password</span>
              </button>

              <button
                type="button"
                className={`nav-link rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'create-user' ? 'active bg-navy text-white shadow-sm' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('create-user')}
              >
                <UserPlus size={18} className={activeTab === 'create-user' ? 'text-gold' : ''} />
                <span>2. Create New User ID & Password</span>
              </button>

              <button
                type="button"
                className={`nav-link rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                  activeTab === 'user-list' ? 'active bg-navy text-white shadow-sm' : 'text-secondary'
                }`}
                onClick={() => setActiveTab('user-list')}
              >
                <Users size={18} className={activeTab === 'user-list' ? 'text-gold' : ''} />
                <span>3. All System Accounts ({users.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: CHANGE PASSWORD / FORGOT CREDENTIALS RECOVERY               */}
        {/* ================================================================= */}
        {activeTab === 'change-password' && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{ borderLeft: '4px solid #D4AF37' }}
                >
                  <div>
                    <h5 className="font-heading fw-bold mb-0 text-navy">
                      Change or Reset Password
                    </h5>
                    <p className="text-muted small mb-0">
                      Recover forgotten credentials or assign a new secure password to any user account.
                    </p>
                  </div>
                  <span className="badge bg-light text-navy border px-3 py-1.5 fw-semibold">
                    Direct Recovery
                  </span>
                </div>

                <div className="card-body p-4">
                  {pwdMsg.text && (
                    <div
                      className={`alert alert-${pwdMsg.type} d-flex align-items-center p-3 rounded-3 mb-4`}
                      role="alert"
                    >
                      {pwdMsg.type === 'success' ? (
                        <CheckCircle2 size={18} className="me-2 text-success flex-shrink-0" />
                      ) : (
                        <AlertCircle size={18} className="me-2 text-danger flex-shrink-0" />
                      )}
                      <div>{pwdMsg.text}</div>
                    </div>
                  )}

                  <form onSubmit={handleChangePasswordSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-secondary small">
                        Select Target User Account <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select font-mono"
                        value={selectedUserForReset}
                        onChange={(e) => setSelectedUserForReset(e.target.value)}
                        required
                      >
                        <option value="">-- Choose User ID to Reset --</option>
                        {users.map((u) => (
                          <option key={u.username} value={u.username}>
                            {u.username} ({u.name} - {u.role.toUpperCase()})
                          </option>
                        ))}
                      </select>
                      <div className="form-text small">
                        Select the account whose password you need to reset.
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          New Password <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <Lock
                            size={16}
                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                          />
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            className="form-control ps-5 pe-5 font-mono"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={4}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                            onClick={() => setShowNewPass(!showNewPass)}
                          >
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          Confirm New Password <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <Lock
                            size={16}
                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                          />
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            className="form-control ps-5 font-mono"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-4 small"
                        onClick={() => {
                          setSelectedUserForReset('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPwdMsg({ type: '', text: '' });
                        }}
                      >
                        Clear Form
                      </button>

                      <button
                        type="submit"
                        className="btn btn-gold rounded-pill px-4 py-2 font-heading fw-bold d-flex align-items-center gap-2 shadow-sm"
                      >
                        <RefreshCw size={16} />
                        Update Password Now
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Quick Info Box */}
              <div className="card border-0 bg-white shadow-sm rounded-4 mt-3 p-3">
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <ShieldCheck size={18} className="text-gold flex-shrink-0" />
                  <span>
                    <strong>Instant Activation:</strong> Once updated, the user can immediately log in on the{' '}
                    <Link to="/login" className="text-decoration-underline text-navy fw-semibold">
                      Login Screen
                    </Link>{' '}
                    with the new password.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: CREATE NEW USER ID & PASSWORD                              */}
        {/* ================================================================= */}
        {activeTab === 'create-user' && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div
                  className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
                  style={{ borderLeft: '4px solid #0A192F' }}
                >
                  <div>
                    <h5 className="font-heading fw-bold mb-0 text-navy">
                      Create New User ID & Password
                    </h5>
                    <p className="text-muted small mb-0">
                      Provision a new internal operator, manager, or supervisor account.
                    </p>
                  </div>
                  <span className="badge bg-navy text-white px-3 py-1.5 fw-semibold">
                    New Account
                  </span>
                </div>

                <div className="card-body p-4">
                  {createMsg.text && (
                    <div
                      className={`alert alert-${createMsg.type} d-flex align-items-center p-3 rounded-3 mb-4`}
                      role="alert"
                    >
                      {createMsg.type === 'success' ? (
                        <CheckCircle2 size={18} className="me-2 text-success flex-shrink-0" />
                      ) : (
                        <AlertCircle size={18} className="me-2 text-danger flex-shrink-0" />
                      )}
                      <div>{createMsg.text}</div>
                    </div>
                  )}

                  <form onSubmit={handleCreateUserSubmit}>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          User ID (Username) <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <User
                            size={16}
                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                          />
                          <input
                            type="text"
                            className="form-control ps-5 font-mono"
                            placeholder="Enter User ID (e.g. operator1)"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-text small">Used to sign in. Must be unique.</div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          System Role <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select fw-semibold"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          required
                        >
                          <option value="worker">Worker (Diamond Polisher / Artisan)</option>
                          <option value="supervisor">Supervisor (QC & Deposit Inward)</option>
                          <option value="admin">Admin (Full Access & Settings)</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="user@divyimpex.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          Initial Password <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <Lock
                            size={16}
                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                          />
                          <input
                            type={showCreatePass ? 'text' : 'password'}
                            className="form-control ps-5 pe-5 font-mono"
                            placeholder="••••••••"
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            minLength={4}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted"
                            onClick={() => setShowCreatePass(!showCreatePass)}
                          >
                            {showCreatePass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-secondary small">
                          Confirm Password <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <Lock
                            size={16}
                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                          />
                          <input
                            type={showCreatePass ? 'text' : 'password'}
                            className="form-control ps-5 font-mono"
                            placeholder="••••••••"
                            value={createConfirmPass}
                            onChange={(e) => setCreateConfirmPass(e.target.value)}
                            minLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-4 small"
                        onClick={() => {
                          setNewUsername('');
                          setCreatePassword('');
                          setCreateConfirmPass('');
                          setFullName('');
                          setEmail('');
                          setCreateMsg({ type: '', text: '' });
                        }}
                      >
                        Reset Form
                      </button>

                      <button
                        type="submit"
                        className="btn btn-navy rounded-pill px-4 py-2 font-heading fw-bold d-flex align-items-center gap-2 shadow-sm"
                        style={{ backgroundColor: '#0A192F', color: '#FFFFFF' }}
                      >
                        <UserPlus size={16} className="text-gold" />
                        Create Account
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ALL SYSTEM ACCOUNTS DIRECTORY                              */}
        {/* ================================================================= */}
        {activeTab === 'user-list' && (
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
              <div>
                <h5 className="font-heading fw-bold mb-0 text-navy">
                  Registered System Accounts Directory
                </h5>
                <p className="text-muted small mb-0">
                  Review all existing User IDs. Use this view if you forgot a User ID or need to rename one.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-gold rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
                onClick={() => setActiveTab('create-user')}
              >
                <UserPlus size={14} /> Add User
              </button>
            </div>

            {/* Inline Rename Box if active */}
            {editingUserId && (
              <div className="p-3 bg-light border-bottom">
                <form onSubmit={handleRenameSubmit} className="row g-2 align-items-center">
                  <div className="col-auto">
                    <span className="fw-semibold small text-navy">Rename User ID:</span>
                    <span className="badge bg-secondary ms-1 font-mono">{editingUserId}</span>
                  </div>
                  <div className="col-sm-4">
                    <input
                      type="text"
                      className="form-control form-control-sm font-mono"
                      placeholder="Enter new User ID"
                      value={newUserIdVal}
                      onChange={(e) => setNewUserIdVal(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="col-auto">
                    <button type="submit" className="btn btn-sm btn-navy text-white me-2">
                      Save Change
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setEditingUserId(null);
                        setNewUserIdVal('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {renameMsg.text && (
                    <div className={`col-12 small text-${renameMsg.type}`}>
                      {renameMsg.text}
                    </div>
                  )}
                </form>
              </div>
            )}

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-uppercase text-secondary">
                    <th className="ps-4">#</th>
                    <th>User ID (Username)</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Created</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.username}>
                      <td className="ps-4 text-muted small">{idx + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white shadow-xs"
                            style={{
                              width: '28px',
                              height: '28px',
                              backgroundColor:
                                u.role === 'admin'
                                  ? '#D4AF37'
                                  : u.role === 'supervisor'
                                  ? '#0A192F'
                                  : '#4A5568',
                              fontSize: '0.75rem'
                            }}
                          >
                            {u.avatar || u.name?.charAt(0) || 'U'}
                          </span>
                          <span className="font-mono fw-bold text-navy">{u.username}</span>
                        </div>
                      </td>
                      <td className="fw-medium">{u.name}</td>
                      <td>
                        <span
                          className={`badge text-uppercase px-2 py-1 ${
                            u.role === 'admin'
                              ? 'bg-warning text-dark border border-warning'
                              : u.role === 'supervisor'
                              ? 'bg-info text-dark'
                              : 'bg-light text-secondary border'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="small text-muted">{u.email || '—'}</td>
                      <td className="small text-muted">{u.createdAt || 'System Default'}</td>
                      <td className="text-end pe-4">
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary d-flex align-items-center gap-1 py-1 px-2 small"
                            onClick={() => triggerPasswordResetForUser(u.username)}
                            title="Reset Password for this account"
                          >
                            <Key size={13} /> Reset Pass
                          </button>

                          <button
                            type="button"
                            className="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2 small"
                            onClick={() => {
                              setEditingUserId(u.username);
                              setNewUserIdVal(u.username);
                            }}
                            title="Edit User ID"
                          >
                            <Edit3 size={13} /> Edit ID
                          </button>

                          <button
                            type="button"
                            className="btn btn-xs btn-outline-danger py-1 px-2 small"
                            onClick={() => handleDelete(u.username)}
                            title="Delete user"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete User Account Confirmation Modal */}
      {userToDelete && (
        <ConfirmModal
          isOpen={!!userToDelete}
          onClose={() => !submitting && setUserToDelete(null)}
          onConfirm={confirmDeleteUser}
          isLoading={submitting}
          title="Delete User Account"
          message={`Are you sure you want to delete user account "${userToDelete}"? This user will permanently lose access to the DIVY IMPEX portal.`}
          confirmText="Delete Account"
          cancelText="Cancel"
          confirmVariant="danger"
          icon="delete"
        />
      )}
    </div>
  );
};

export default AdminCredentials;
