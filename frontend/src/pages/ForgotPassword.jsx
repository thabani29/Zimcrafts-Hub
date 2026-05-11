import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await apiService.forgotPassword(email);
            if (response.success) {
                setMessage('Password reset email sent. Please check your inbox.');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return ( 
        <div className = "min-h-screen bg-gray-50 py-12" >
            <div className = "container mx-auto px-4" >
                <div className = "max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8" >
                    <div className = "text-center mb-8" >
                        <h2 className = "text-3xl font-bold text-primary-brown" > Forgot Password </h2> 
                        <p className = "text-gray-600 mt-2" > Enter your email address to receive a reset link </p> 
                    </div>

                    { error && ( 
                        <div className = "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" > { error } </div>
                    )}

                    { message && ( 
                        <div className = "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6" > { message } </div>
                    )}

                    <form onSubmit = { handleSubmit } className = "space-y-6" >
                        <div>
                            <label className = "block text-sm font-medium text-gray-700 mb-2" > Email Address * </label> 
                            <input type = "email"
                                value = { email }
                                onChange = { (e) => setEmail(e.target.value) }
                                required className = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent transition-all duration-300"
                                placeholder = "your@email.com"
                                disabled = { loading }
                            /> 
                        </div>

                        <button type = "submit"
                            disabled = { loading }
                            className = "w-full bg-primary-brown hover:bg-primary-orange text-white py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                        >
                            { loading ? 'Sending...' : 'Send Reset Link' } 
                        </button> 
                    </form>

                    <div className = "mt-6 text-center" >
                        <p className = "text-gray-600" > Remember your password ? { ' ' } 
                            <Link to = "/login" className = "text-primary-orange hover:text-primary-brown font-semibold transition-colors" > Back to Login </Link> 
                        </p> 
                    </div> 
                </div> 
            </div> 
        </div>
    );
};

export default ForgotPassword;
