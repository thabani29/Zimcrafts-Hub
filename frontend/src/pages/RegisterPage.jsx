import React from 'react';
import Register from '../components/auth/Register';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <Register />
      </div>
    </div>
  );
};

export default RegisterPage;