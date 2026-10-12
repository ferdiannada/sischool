import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Tab Button with sliding active indicator
 * Used in profile pages with multiple tabs
 */
const TabButton = ({ id, label, icon: Icon, activeTab, onTabChange }) => (
    <button
        onClick={() => onTabChange(id)}
        className={`
            relative flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300
            ${activeTab === id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }
        `}
    >
        {activeTab === id && (
            <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/30"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        )}
        <span className="relative z-10 flex items-center gap-2">
            <Icon className={`h-4 w-4 ${activeTab === id ? 'text-white' : ''}`} />
            {label}
        </span>
    </button>
);

export default TabButton;
