import React from 'react';
import { Copy } from 'lucide-react';

/**
 * InfoRow - Display a labeled info item with optional copy functionality
 * Used in profile pages to display user information
 */
const InfoRow = ({
    icon: Icon,
    label,
    value,
    copyable = false,
    highlight = false,
    onCopy
}) => {
    const handleCopy = () => {
        if (copyable && value && onCopy) {
            onCopy(value);
        } else if (copyable && value) {
            navigator.clipboard.writeText(value);
        }
    };

    return (
        <div className={`
            group flex items-center gap-4 p-3 rounded-xl transition-all duration-300
            ${highlight ? 'bg-primary-50/50 hover:bg-primary-50' : 'hover:bg-gray-50'}
        `}>
            <div className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                ${highlight
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-white border border-gray-100 text-gray-400 group-hover:border-primary-200 group-hover:text-primary-500'
                }
            `}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                    {label}
                </p>
                <div className="flex items-center gap-2">
                    <p className={`font-semibold truncate ${highlight ? 'text-primary-900' : 'text-gray-900'}`}>
                        {value || '-'}
                    </p>
                    {copyable && value && (
                        <button
                            onClick={handleCopy}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white rounded-md transition-all text-gray-400 hover:text-primary-600"
                            title="Salin"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InfoRow;
