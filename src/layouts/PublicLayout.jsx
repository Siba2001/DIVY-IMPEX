import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Toast from '../components/common/Toast';

const PublicLayout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <main className="flex-grow-1">{children}</main>
      <Footer />
      <Toast />
    </div>
  );
};

export default PublicLayout;
