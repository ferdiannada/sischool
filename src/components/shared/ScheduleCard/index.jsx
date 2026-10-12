import React from 'react';
import { Clock, MapPin, User, ChevronRight, Activity } from 'lucide-react';
import { Button } from '../../ui/Button';
import { cn } from '../../../utils/cn';

const ScheduleCard = ({ subject, time, className, teacher, room, status = 'upcoming', onAction, actionLabel, role }) => {
    const statusConfig = {
        upcoming: {
            color: 'bg-blue-500',
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            label: 'Akan Datang',
            border: 'border-l-blue-500',
            icon: Clock
        },
        ongoing: {
            color: 'bg-emerald-500',
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            label: 'Sedang Berlangsung',
            border: 'border-l-emerald-500',
            icon: Activity
        },
        completed: {
            color: 'bg-gray-400',
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            label: 'Selesai',
            border: 'border-l-gray-300',
            icon: CheckCircleIcon
        },
        cancelled: {
            color: 'bg-red-500',
            bg: 'bg-red-50',
            text: 'text-red-700',
            label: 'Dibatalkan',
            border: 'border-l-red-500',
            icon: AlertCircleIcon
        }
    };

    function CheckCircleIcon(props) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        )
    }

    function AlertCircleIcon(props) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        )
    }

    const config = statusConfig[status] || statusConfig.upcoming;
    const StatusIcon = config.icon;

    return (
        <div className={cn(
            "group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden",
            config.border,
            "border-l-[6px]",
            className
        )}>
            {/* Live Indicator Background for Ongoing */}
            {status === 'ongoing' && (
                <div className="absolute inset-0 bg-emerald-50/30 pointer-events-none" />
            )}

            <div className="relative p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between md:justify-start gap-4 mb-3">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                config.bg,
                                config.text
                            )}>
                                {status === 'ongoing' && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                )}
                                <StatusIcon className="w-3.5 h-3.5" />
                                {config.label}
                            </span>
                        </div>
                    </div>

                    <h4 className="font-bold text-xl text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                        {subject}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-gray-700 font-mono">{time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{room}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Info & Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 md:min-w-[200px]">
                    {teacher && (
                        <div className="flex items-center gap-3 md:hidden lg:flex">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                                <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="text-sm min-w-0">
                                <p className="text-gray-900 font-semibold truncate max-w-[120px]">{teacher}</p>
                                <p className="text-gray-500 text-xs">Pengajar</p>
                            </div>
                        </div>
                    )}

                    {onAction && (
                        <Button
                            onClick={onAction}
                            size="sm"
                            className={cn(
                                "shrink-0 font-bold transition-all shadow-sm rounded-xl px-4 py-2 h-auto",
                                status === 'upcoming' || status === 'ongoing'
                                    ? 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-lg hover:shadow-primary-600/20 hover:-translate-y-0.5'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            {actionLabel || 'Detail'}
                            <ChevronRight className={cn(
                                "ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5",
                                status === 'upcoming' || status === 'ongoing' ? 'text-white' : 'text-gray-400'
                            )} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export { ScheduleCard };
