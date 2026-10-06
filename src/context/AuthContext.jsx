import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const MOCK_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin Manager',
    email: 'admin@divyimpex.com',
    avatar: 'A'
  },
  {
    username: 'supervisor',
    password: 'supervisor123',
    role: 'supervisor',
    name: 'QC Supervisor',
    email: 'supervisor@divyimpex.com',
    avatar: 'S'
  },
  {
    username: 'worker',
    password: 'worker123',
    role: 'worker',
    name: 'Ramesh Parmar',
    workerId: 'w-1',
    email: 'ramesh@divyimpex.com',
    avatar: 'R'
  },
  {
    username: 'worker2',
    password: 'worker123',
    role: 'worker',
    name: 'Suresh Patel',
    workerId: 'w-2',
    email: 'suresh@divyimpex.com',
    avatar: 'S'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('divy_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (username, password) => {
    const cleanUser = username.trim().toLowerCase();
    const foundUser = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === password
    );

    if (foundUser) {
      const { password, ...userSession } = foundUser;
      setUser(userSession);
      localStorage.setItem('divy_auth_user', JSON.stringify(userSession));
      return { success: true, user: userSession };
    } else {
      return { success: false, message: 'Invalid username or password!' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('divy_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
