// frontend/src/components/auth/Register.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'customer',
        Cell: '', // Make sure this matches your backend field name
        address: 'home',
        street: '',
        city: '',
        state: '',
        country: 'Zimbabwe',
        zipCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear field error when user starts typing
        if (fieldErrors[e.target.name]) {
            setFieldErrors({
                ...fieldErrors,
                [e.target.name]: ''
            });
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Cell phone validation - IMPORTANT: This field is required by backend
        if (!formData.Cell) {
            errors.Cell = 'Phone number is required';
        } else if (!/^\+?[1-9]\d{0,15}$/.test(formData.Cell)) {
            errors.Cell = 'Please enter a valid phone number';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('Form submitted with data:', formData); // Debug log
        
        if (!validateForm()) {
            console.log('Validation failed:', fieldErrors);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Prepare data for backend - IMPORTANT: Field names must match backend schema
            const userData = {
                name: formData.name.trim(),
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                role: formData.userType, // 'customer', 'artisan/seller', or 'admin'
                Cell: formData.Cell, // Make sure this field name is exactly 'Cell'
                address: formData.address,
                street: formData.street || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                country: formData.country,
                zipCode: formData.zipCode || undefined
            };

            console.log('Sending registration data to API:', userData); // Debug

            const response = await register(userData);
            
            console.log('Registration successful:', response); // Debug
            
            // Show success message and redirect to login
            navigate('/login', { 
                state: { 
                    message: 'Registration successful! Please login.' 
                }
            });
            
        } catch (err) {
            console.error('Registration error in component:', err);
            
            // Handle different error types
            if (err.message) {
                setError(err.message);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-primary-brown">Join ZimCraftHub</h2>
                <p className="text-gray-600 mt-2">Create your account and start your journey</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-3 border ${
                                fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange`}
                            placeholder="John Doe"
                        />
                        {fieldErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-3 border ${
                                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange`}
                            placeholder="your@email.com"
                        />
                        {fieldErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-3 border ${
                                fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange`}
                            placeholder="At least 8 characters"
                        />
                        {fieldErrors.password && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-3 border ${
                                fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange`}
                            placeholder="Confirm your password"
                        />
                        {fieldErrors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>
                </div>

                {/* Contact Information - IMPORTANT: Cell field */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number (Cell) *
                        </label>
                        <input
                            type="tel"
                            name="Cell"  // Must be exactly "Cell" with capital C
                            value={formData.Cell}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-3 border ${
                                fieldErrors.Cell ? 'border-red-500' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange`}
                            placeholder="+263 XXX XXX XXX"
                        />
                        {fieldErrors.Cell && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.Cell}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Type
                        </label>
                        <select
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address
                        </label>
                        <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            placeholder="Street address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            placeholder="City"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State/Province
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            placeholder="State"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            placeholder="Country"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zip/Postal Code
                        </label>
                        <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            placeholder="Zip code"
                        />
                    </div>
                </div>

                {/* User Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    I want to join as a *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                     formData.userType === 'customer' 
                    ? 'border-primary-orange bg-orange-50' 
                    : 'border-gray-300'
                    }`}>
                    <input
                        type="radio"
                        name="userType"
                        value="customer"
                        checked={formData.userType === 'customer'}
                        onChange={handleChange}
                        className="mr-3 text-primary-orange"
                    />
                 <div>
                    <div className="font-semibold">🛒 Customer</div>
                    <div className="text-sm text-gray-600">Shop for crafts</div>
                </div>
                </label>

            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                formData.userType === 'artisan/seller' 
                ? 'border-primary-orange bg-orange-50' 
                : 'border-gray-300'
         }`}>
            <input
                type="radio"
                name="userType"
                value="artisan/seller"
                checked={formData.userType === 'artisan/seller'}
                onChange={handleChange}
                className="mr-3 text-primary-orange"
            />
            <div>
                <div className="font-semibold">👨‍🎨 Artisan/Seller</div>
                <div className="text-sm text-gray-600">Sell crafts</div>
            </div>
        </label>

    </div>
</div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-brown hover:bg-primary-orange text-white py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg disabled:opacity-50"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                            Creating Account...
                        </div>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-orange hover:text-primary-brown font-semibold">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;