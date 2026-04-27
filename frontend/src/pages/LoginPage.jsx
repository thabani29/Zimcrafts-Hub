import React from 'react';
import Login from '../components/auth/Login';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <Login />
      </div>
    </div>
  );
};

export default LoginPage;