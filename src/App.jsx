import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DiamondProvider } from './context/DiamondContext';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import DiamondsPublic from './pages/public/DiamondsPublic';
import Manufacturing from './pages/public/Manufacturing';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';

// Private Pages
import Dashboard from './pages/private/Dashboard';
import Companies from './pages/private/Companies';
import CompanyDetails from './pages/private/CompanyDetails';
import DiamondReceiving from './pages/private/DiamondReceiving';
import DiamondList from './pages/private/DiamondList';
import WorkerAssignment from './pages/private/WorkerAssignment';
import Workers from './pages/private/Workers';
import WorkerDetails from './pages/private/WorkerDetails';
import WorkerDashboard from './pages/private/WorkerDashboard';
import DepositVerification from './pages/private/DepositVerification';
import Stock from './pages/private/Stock';
import Reports from './pages/private/Reports';

// Smart Diamond Route Component
const DiamondRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DiamondList /> : <DiamondsPublic />;
};

function App() {
  return (
    <AuthProvider>
      <DiamondProvider>
        <Router>
          <Routes>
            {/* Public Portfolio Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/diamonds-showcase" element={<DiamondsPublic />} />
            <Route path="/manufacturing" element={<Manufacturing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />

            {/* Smart route for /diamonds */}
            <Route path="/diamonds" element={<DiamondRoute />} />

            {/* Private Management Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:id" element={<CompanyDetails />} />
            <Route path="/diamond-receiving" element={<DiamondReceiving />} />
            <Route path="/assignment" element={<WorkerAssignment />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/workers/:id" element={<WorkerDetails />} />
            <Route path="/worker-dashboard" element={<WorkerDashboard />} />
            <Route path="/deposit" element={<DepositVerification />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/reports" element={<Reports />} />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DiamondProvider>
    </AuthProvider>
  );
}

export default App;
