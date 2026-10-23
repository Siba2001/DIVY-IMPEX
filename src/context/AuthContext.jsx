import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext();

const USERS_CACHE_KEY = 'divy_users_directory_cache';
const AUTH_SESSION_KEY = 'divy_auth_user';
const LAST_ACTIVITY_KEY = 'divy_auth_last_activity';
const SESSION_NOTICE_KEY = 'divy_auth_session_notice';

// =========================================================================
// SHARED WORKSTATION TIMEOUT LIMITS (Manufacturing Security Standards)
// =========================================================================
// 1. Inactivity Timeout: 60 minutes of zero mouse/keyboard interactions
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
// 2. Absolute Session Limit: 12 hours (covers standard factory shift)
const MAX_SHIFT_DURATION_MS = 12 * 60 * 60 * 1000;

// Clean initial public user directory (NO PASSWORDS STORED IN CODE)
const INITIAL_USERS_PUBLIC = [
  { username: 'admin', role: 'admin', name: 'Admin Manager', email: 'admin@divyimpex.com', avatar: 'A' },
  { username: 'supervisor', role: 'supervisor', name: 'QC Supervisor', email: 'supervisor@divyimpex.com', avatar: 'S' },
  { username: 'worker', role: 'worker', name: 'Ramesh Parmar', email: 'ramesh@divyimpex.com', avatar: 'R' },
  { username: 'worker2', role: 'worker', name: 'Suresh Patel', email: 'suresh@divyimpex.com', avatar: 'S' }
];

const loadCachedUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading cached users directory:', e);
  }
  return INITIAL_USERS_PUBLIC;
};

// Validates whether the stored session is still fresh and unexpired
const getInitialValidSession = () => {
  try {
    const saved = localStorage.getItem(AUTH_SESSION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    if (!parsed) return null;

    const now = Date.now();
    const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    const lastActiveTime = lastActiveStr ? parseInt(lastActiveStr, 10) : (parsed.loginTime || now);
    const loginTime = parsed.loginTime || lastActiveTime;

    // Check if session has exceeded 60m inactivity
    if (now - lastActiveTime > INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.setItem(
        SESSION_NOTICE_KEY,
        'Your session expired due to 60 minutes of inactivity to protect this shared workstation. Please sign in again.'
      );
      return null;
    }

    // Check if session exceeded 12-hour max shift duration
    if (now - loginTime > MAX_SHIFT_DURATION_MS) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.setItem(
        SESSION_NOTICE_KEY,
        'Your 12-hour factory shift session limit has ended. Please sign in again.'
      );
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(loadCachedUsers);
  const [user, setUser] = useState(getInitialValidSession);
  const lastActivityUpdateRef = useRef(Date.now());

  // Perform secure automatic logout with notice
  const performAutoLogout = useCallback((reasonMessage) => {
    setUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    if (reasonMessage) {
      localStorage.setItem(SESSION_NOTICE_KEY, reasonMessage);
    }
  }, []);

  // Standard user-initiated logout
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_NOTICE_KEY);
  }, []);

  // Fetch registered users directory from database on load
  const refreshUsers = useCallback(async () => {
    try {
      const remoteUsers = await apiService.getUsers();
      if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
        setUsers(remoteUsers);
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(remoteUsers));
      }
    } catch (e) {
      console.warn('[DIVY Auth] Could not fetch remote users, using cached directory:', e);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // =========================================================================
  // SHARED COMPUTER INACTIVITY TRACKER & EXPIRY TIMER
  // =========================================================================
  useEffect(() => {
    if (!user) return;

    // Throttled activity updater (records timestamp at most once every 10 seconds)
    const recordUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityUpdateRef.current > 10000) {
        lastActivityUpdateRef.current = now;
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        } catch { }
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Check expiration every 30 seconds
    const intervalTimer = setInterval(() => {
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (!saved) {
        setUser(null);
        return;
      }

      const now = Date.now();
      const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActiveTime = lastActiveStr ? parseInt(lastActiveStr, 10) : now;
      const loginTime = user.loginTime || lastActiveTime;

      // 1. Inactivity timeout check (60 minutes)
      if (now - lastActiveTime > INACTIVITY_TIMEOUT_MS) {
        performAutoLogout(
          'Your session expired due to 60 minutes of inactivity to protect this shared workstation. Please sign in again.'
        );
        return;
      }

      // 2. Absolute 12-hour session limit check
      if (now - loginTime > MAX_SHIFT_DURATION_MS) {
        performAutoLogout(
          'Your 12-hour factory shift session limit has ended. Please sign in again.'
        );
        return;
      }
    }, 30000);

    // Sync across multiple browser tabs
    const handleStorageChange = (e) => {
      if (e.key === AUTH_SESSION_KEY && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordUserActivity);
      });
      clearInterval(intervalTimer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, performAutoLogout]);

  // Authenticate user via Backend SHA-256 verification
  const login = async (username, password) => {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Please enter both User ID and Password!' };
    }

    try {
      const result = await apiService.loginUser(cleanUser, cleanPass);
      if (result && result.success && result.user) {
        const sessionPayload = {
          ...result.user,
          loginTime: Date.now()
        };
        setUser(sessionPayload);
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionPayload));
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        localStorage.removeItem(SESSION_NOTICE_KEY);
        return { success: true, user: sessionPayload };
      } else {
        return { success: false, message: result?.message || 'Invalid username or password!' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Authentication failed. Please verify credentials or network connection.' };
    }
  };

  // Create new User ID & Password in Database
  const createUser = async ({ username, password, name, role = 'worker', email = '', workerId = '' }) => {
    const cleanUser = String(username || '').trim();
    const cleanPass = String(password || '').trim();
    const cleanName = String(name || '').trim();

    if (!cleanUser) {
      return { success: false, message: 'User ID (Username) is required!' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long!' };
    }
    if (!cleanName) {
      return { success: false, message: 'Full Name is required!' };
    }

    try {
      const result = await apiService.createUser({
        username: cleanUser,
        password: cleanPass,
        name: cleanName,
        role: role.toLowerCase(),
        email: email.trim(),
        workerId: workerId.trim() || undefined
      });

      if (result && result.success) {
        await refreshUsers();
        return { success: true, message: result.message || `User account "${cleanUser}" created successfully!` };
      }
      return { success: false, message: result?.message || 'Failed to create user in database.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error connecting to database to create user.' };
    }
  };

  // Change Password for any user (stored in Database with SHA-256)
  const changeUserPassword = async (username, newPassword) => {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(newPassword || '').trim();

    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long!' };
    }

    try {
      const result = await apiService.changeUserPassword(cleanUser, cleanPass);
      if (result && result.success) {
        return { success: true, message: result.message || `Password for "${cleanUser}" updated successfully!` };
      }
      return { success: false, message: result?.message || 'Failed to update password in database.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error communicating with database.' };
    }
  };

  // Change User ID (Username) in Database
  const changeUserId = async (oldUsername, newUsername) => {
    const cleanOld = String(oldUsername || '').trim();
    const cleanNew = String(newUsername || '').trim();

    if (!cleanNew) {
      return { success: false, message: 'New User ID cannot be empty!' };
    }

    try {
      const result = await apiService.changeUserId(cleanOld, cleanNew);
      if (result && result.success) {
        await refreshUsers();
        if (user && user.username.toLowerCase() === cleanOld.toLowerCase()) {
          const updatedSession = { ...user, username: cleanNew };
          setUser(updatedSession);
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedSession));
        }
        return { success: true, message: result.message || `User ID changed to "${cleanNew}"!` };
      }
      return { success: false, message: result?.message || 'Failed to change User ID.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error connecting to database.' };
    }
  };

  // Delete User from Database
  const deleteUser = async (username) => {
    const cleanUser = String(username || '').trim();
    try {
      const result = await apiService.deleteUser(cleanUser);
      if (result && result.success) {
        await refreshUsers();
        if (user && user.username.toLowerCase() === cleanUser.toLowerCase()) {
          logout();
        }
        return { success: true, message: result.message || `User "${cleanUser}" deleted.` };
      }
      return { success: false, message: result?.message || 'Failed to delete user.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error connecting to database.' };
    }
  };

  // Verify Master Key or Admin Password through backend API (ZERO SECRETS IN FRONTEND CODE)
  const verifyAdminMasterKey = async (inputKey) => {
    const cleanKey = String(inputKey || '').trim();
    if (!cleanKey) return false;

    try {
      return await apiService.verifyAdminAccess(cleanKey);
    } catch (err) {
      console.warn('[DIVY Auth] Admin access verification error:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        refreshUsers,
        login,
        logout,
        createUser,
        changeUserPassword,
        changeUserId,
        deleteUser,
        verifyAdminMasterKey,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
