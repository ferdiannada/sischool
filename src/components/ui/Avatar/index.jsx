import * as React from 'react';
import { cn } from '../../../utils/cn';

const Avatar = React.forwardRef(({ className, src, alt, fallback, size = "default", ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-xl",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex shrink-0 overflow-hidden rounded-full bg-gray-100",
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {src && !hasError ? (
                <img
                    src={src}
                    alt={alt || "Avatar"}
                    className="aspect-square h-full w-full object-cover"
                    onError={() => setHasError(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
                    {fallback || (alt ? alt.charAt(0).toUpperCase() : "?")}
                </div>
            )}
        </div>
    );
});

Avatar.displayName = "Avatar";

export { Avatar };
