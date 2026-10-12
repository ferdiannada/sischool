import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Shared StatsCard component
 * Supports 'simple' (standard border/bg) and 'premium' (gradient/glass) variants
 */
const StatsCard = ({
    label,
    title, // Alias for label
    value,
    icon: Icon,
    variant = 'simple',
    color = 'indigo',
    trend, // 'up' or 'down'
    change,
    subtext, // Additional info
    delay = 0,
    className
}) => {
    const isPremium = variant === 'premium';
    const displayLabel = label || title;

    const colorClasses = {
        indigo: {
            simple: "bg-indigo-50 text-indigo-600",
            iconBg: "bg-indigo-100",
            premium: "from-indigo-600 to-indigo-800 shadow-indigo-200",
            glassBg: "bg-white/20",
        },
        blue: {
            simple: "bg-blue-50 text-blue-600",
            iconBg: "bg-blue-100",
            premium: "from-blue-500 to-blue-700 shadow-blue-200",
            glassBg: "bg-white/20",
        },
        emerald: {
            simple: "bg-emerald-50 text-emerald-600",
            iconBg: "bg-emerald-100",
            premium: "from-emerald-500 to-emerald-700 shadow-emerald-200",
            glassBg: "bg-white/20",
        },
        rose: {
            simple: "bg-rose-50 text-rose-600",
            iconBg: "bg-rose-100",
            premium: "from-rose-500 to-rose-700 shadow-rose-200",
            glassBg: "bg-white/20",
        },
        amber: {
            simple: "bg-amber-50 text-amber-600",
            iconBg: "bg-amber-100",
            premium: "from-amber-500 to-amber-700 shadow-amber-200",
            glassBg: "bg-white/20",
        },
        teal: {
            simple: "bg-teal-50 text-teal-600",
            iconBg: "bg-teal-100",
            premium: "from-teal-500 to-teal-700 shadow-teal-200",
            glassBg: "bg-white/20",
        },
        green: {
            simple: "bg-green-50 text-green-600",
            iconBg: "bg-green-100",
            premium: "from-green-500 to-green-700 shadow-green-200",
            glassBg: "bg-white/20",
        },
        orange: {
            simple: "bg-orange-50 text-orange-600",
            iconBg: "bg-orange-100",
            premium: "from-orange-500 to-orange-700 shadow-orange-200",
            glassBg: "bg-white/20",
        },
        red: {
            simple: "bg-red-50 text-red-600",
            iconBg: "bg-red-100",
            premium: "from-red-500 to-red-700 shadow-red-200",
            glassBg: "bg-white/20",
        },
        yellow: {
            simple: "bg-yellow-50 text-yellow-600",
            iconBg: "bg-yellow-100",
            premium: "from-yellow-400 to-yellow-600 shadow-yellow-200",
            glassBg: "bg-white/20",
        },
        purple: {
            simple: "bg-purple-50 text-purple-600",
            iconBg: "bg-purple-100",
            premium: "from-purple-500 to-purple-700 shadow-purple-200",
            glassBg: "bg-white/20",
        },
        violet: {
            simple: "bg-violet-50 text-violet-600",
            iconBg: "bg-violet-100",
            premium: "from-violet-500 to-violet-700 shadow-violet-200",
            glassBg: "bg-white/20",
        },
        success: {
            simple: "bg-emerald-50 text-emerald-600",
            iconBg: "bg-emerald-100",
            premium: "from-emerald-500 to-emerald-700 shadow-emerald-200",
            glassBg: "bg-white/20",
        },
        warning: {
            simple: "bg-amber-50 text-amber-600",
            iconBg: "bg-amber-100",
            premium: "from-amber-500 to-amber-700 shadow-amber-200",
            glassBg: "bg-white/20",
        },
        info: {
            simple: "bg-blue-50 text-blue-600",
            iconBg: "bg-blue-100",
            premium: "from-blue-500 to-blue-700 shadow-blue-200",
            glassBg: "bg-white/20",
        },
        danger: {
            simple: "bg-rose-50 text-rose-600",
            iconBg: "bg-rose-100",
            premium: "from-rose-500 to-rose-700 shadow-rose-200",
            glassBg: "bg-white/20",
        }
    };

    const currentStyles = colorClasses[color] || colorClasses.indigo;

    if (isPremium) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay }}
                whileHover={{ y: -5 }}
                className={cn("relative group", className)}
            >
                <div className={cn(
                    "relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 bg-gradient-to-br",
                    currentStyles.premium
                )}>
                    {/* Background Decorative Icon */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Icon className="w-24 h-24 text-white transform rotate-12 translate-x-4 translate-y-4" />
                    </div>

                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-2.5 rounded-xl backdrop-blur-sm shadow-inner", currentStyles.glassBg)}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            {change && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center bg-white/20 backdrop-blur-md border border-white/10 text-white">
                                    {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {change}
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm font-medium text-white/80 mb-1">{displayLabel}</h3>
                        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -5 }}
            className={className}
        >
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className={cn("p-3 rounded-xl", currentStyles.simple)}>
                            <Icon className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-3xl font-bold text-gray-900 mb-1">{value}</h4>
                        <p className="font-medium text-gray-500 mb-1">{displayLabel}</p>
                        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default StatsCard;
