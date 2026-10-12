import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import { Avatar } from '../../../components/ui/Avatar';
import { MessageSquare, Check, X, Clock, HelpCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Modern color palette for statuses
const statusStyles = {
    hadir: {
        active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2',
        inactive: 'bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200',
        icon: Check,
        label: 'Hadir'
    },
    izin: {
        active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500 ring-offset-2',
        inactive: 'bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-200',
        icon: Clock,
        label: 'Izin'
    },
    sakit: {
        active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-500 ring-offset-2',
        inactive: 'bg-white text-gray-500 hover:bg-amber-50 hover:text-amber-600 border border-gray-200',
        icon: HelpCircle,
        label: 'Sakit'
    },
    alpha: {
        active: 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-500 ring-offset-2',
        inactive: 'bg-white text-gray-500 hover:bg-rose-50 hover:text-rose-600 border border-gray-200',
        icon: X,
        label: 'Alpha'
    },
};

const AttendanceListItem = ({ student, status, note, onStatusChange, onNoteChange, disabled }) => {
    // Only show notes if they exist or user toggles them
    const [showNote, setShowNote] = useState(!!note);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            layout
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300",
                "hover:shadow-md hover:border-amber-100 focus-within:ring-2 focus-within:ring-amber-500/20"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Active Status Indicator Strip */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300",
                status === 'hadir' && "bg-emerald-500",
                status === 'izin' && "bg-blue-500",
                status === 'sakit' && "bg-amber-500",
                status === 'alpha' && "bg-rose-500",
                !status && "bg-gray-100"
            )} />

            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between pl-3">
                {/* Student Info */}
                <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="relative">
                        <Avatar
                            fallback={student.name?.charAt(0) || '?'}
                            className="h-14 w-14 border-4 border-white shadow-md text-lg"
                        />
                        {/* Status Dot */}
                        <div className={cn(
                            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white shadow-sm transition-colors flex items-center justify-center",
                            status === 'hadir' ? "bg-emerald-500" :
                                status === 'izin' ? "bg-blue-500" :
                                    status === 'sakit' ? "bg-amber-500" :
                                        status === 'alpha' ? "bg-rose-500" : "bg-gray-300"
                        )}>
                            {status === 'hadir' && <Check className="w-3 h-3 text-white" />}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{student.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-600">
                                {student.nis}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions & Controls */}
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Status Pills */}
                    <div className="flex-1 grid grid-cols-4 gap-2 sm:flex sm:gap-3 p-1.5 bg-gray-50/80 rounded-xl border border-gray-100/50">
                        {Object.entries(statusStyles).map(([key, config]) => {
                            const isActive = status === key;
                            const Icon = config.icon;

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onStatusChange(student.id, key)}
                                    className={cn(
                                        "relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200",
                                        isActive ? config.active : config.inactive,
                                        disabled && "opacity-50 cursor-not-allowed grayscale"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4 sm:h-4 sm:w-4", isActive ? "stroke-[3px]" : "")} />
                                    <span className="hidden sm:inline">{config.label}</span>
                                    {/* Mobile label shorthand maybe? No, keep it clean */}
                                </button>
                            );
                        })}
                    </div>

                    {/* Note Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setShowNote(!showNote)}
                        className={cn(
                            "p-3 rounded-xl transition-all duration-200 border flex items-center justify-center sm:w-auto",
                            (showNote || note)
                                ? "text-indigo-600 bg-indigo-50 border-indigo-200 shadow-sm"
                                : "text-gray-400 bg-white border-gray-100 hover:text-gray-600 hover:bg-gray-50"
                        )}
                        title={showNote ? "Tutup Catatan" : "Tambahkan Catatan"}
                    >
                        <MessageSquare className="h-5 w-5" />
                        <span className="ml-2 text-sm font-medium sm:hidden">
                            {note ? 'Edit Catatan' : 'Tambah Catatan'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Note Input Area */}
            <AnimatePresence>
                {(showNote || note) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 md:pl-20">
                            <div className="relative">
                                <textarea
                                    rows={2}
                                    placeholder={`Tambahkan keterangan untuk ${student.name}...`}
                                    value={note || ''}
                                    onChange={(e) => onNoteChange(student.id, e.target.value)}
                                    className="w-full text-sm px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 resize-none"
                                    disabled={disabled}
                                />
                                <div className="absolute right-3 top-3 text-indigo-300 pointer-events-none">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AttendanceListItem;
