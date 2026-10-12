import React from 'react';
import { cn } from '../../utils/cn'; // Assuming cn utility exists, otherwise I'll need to check or use template literals

const GlassCard = ({ children, className, ...props }) => {
    return (
        <div
            className={cn(
                "backdrop-blur-md bg-white/40 border border-white/50 shadow-lg rounded-xl overflow-hidden",
                "transition-all duration-300 hover:shadow-xl hover:bg-white/50",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default GlassCard;
