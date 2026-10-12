import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingScreen Component
 * Used as Suspense fallback for lazy-loaded routes
 */
const LoadingScreen = ({ message = 'Memuat...' }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
                <p className="text-gray-600 font-medium">{message}</p>
                <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
            </div>
        </div>
    );
};

/**
 * LoadingSpinner Component
 * Smaller loading indicator for inline use
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <Loader2 className={`${sizeClasses[size]} text-primary-600 animate-spin ${className}`} />
    );
};

export { LoadingScreen, LoadingSpinner };
