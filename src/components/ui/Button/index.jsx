import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../../utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
                secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm',
                outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
                ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                danger: 'bg-danger text-white hover:bg-red-600 shadow-sm',
                link: 'text-primary-600 underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
            fullWidth: {
                true: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
            fullWidth: false,
        },
    }
);

const Button = React.forwardRef(({ className, variant, size, fullWidth, isLoading, children, ...props }, ref) => {
    const { fullWidth: _, ...otherProps } = props;

    return (
        <button
            ref={ref}
            className={cn(buttonVariants({ variant, size, fullWidth, className }))}
            disabled={isLoading || props.disabled}
            {...otherProps}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
