const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = {...err };
    error.message = err.message;

    console.error(err.stack);

    // Log the full error for debugging
    console.error('Error details:', err);

    // CastError - usually for invalid MongoDB IDs
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    // Duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || err.keyValue)[0];
        const value = err.keyValue ? err.keyValue[field] : '';
        const message = `Duplicate field value entered: ${field} = ${value}. Please use another value`;
        error = new ErrorResponse(message, 400);
    }

    // Validation error - FIXED: Changed 'object' to 'Object'
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new ErrorResponse(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new ErrorResponse(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Your token has expired';
        error = new ErrorResponse(message, 401);
    }

    // Send response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        // Include stack trace only in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;