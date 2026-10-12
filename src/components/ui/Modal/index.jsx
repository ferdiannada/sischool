import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../Button';

const Modal = React.forwardRef(({ className, isOpen, onClose, title, description, children, footer, size = "md", ...props }, ref) => {
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[calc(100vw-2rem)]",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={ref}
                className={cn(
                    "relative w-full transform rounded-lg bg-white shadow-xl transition-all flex flex-col max-h-[calc(100vh-4rem)]",
                    sizeClasses[size],
                    className
                )}
                role="dialog"
                aria-modal="true"
                {...props}
            >
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {children}
                </div>

                {footer && (
                    <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
});

Modal.displayName = 'Modal';

export { Modal };
