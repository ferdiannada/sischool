import * as React from 'react';
import { cn } from '../../../utils/cn';

const Input = React.forwardRef(({ className, type, label, error, icon: Icon, fullWidth, ...props }, ref) => {
    return (
        <div className={cn("w-full", fullWidth ? "block" : "inline-block")}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
                        error && "border-danger focus:ring-danger",
                        Icon && "pl-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-danger">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export { Input };
