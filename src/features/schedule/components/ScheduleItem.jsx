import React, { useMemo } from 'react';
import { cn } from '../../../utils/cn';
import { Clock, User, MapPin, Edit, Trash2 } from 'lucide-react';

// Predefined pastel palette for auto-coloring
const COLOR_PALETTE = [
    'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100',
    'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
    'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
    'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
    'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
    'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
];

const getColorForString = (str) => {
    if (!str) return 'bg-gray-50 text-gray-700 border-gray-200';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
};

const ScheduleItem = ({
    subject,
    teacher,
    room,
    timeString,
    onClick,
    onDelete,
    isConflict,
    className
}) => {
    const colorClass = useMemo(() => getColorForString(subject), [subject]);

    const conflictStyles = 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400 ring-inset pattern-diagonal-lines-sm';

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative p-2 rounded-lg border text-xs cursor-pointer transition-all h-full flex flex-col justify-between gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 ease-out duration-200",
                isConflict ? conflictStyles : colorClass,
                className
            )}
        >
            {/* Header: Subject & Time */}
            <div className="flex justify-between items-start gap-1">
                <div className="font-bold leading-tight line-clamp-2 text-sm" title={subject}>
                    {subject}
                </div>
            </div>

            {/* Actions Overlay - Visible on Hover */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/40 backdrop-blur-[2px] rounded-md p-0.5 shadow-sm z-10">
                <button
                    className="p-1 hover:bg-white hover:text-blue-600 rounded text-gray-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
                    title="Edit Jadwal"
                >
                    <Edit className="w-3 h-3" />
                </button>
                {onDelete && (
                    <button
                        className="p-1 hover:bg-white hover:text-red-600 rounded text-gray-600 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title="Hapus Jadwal"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Footer: Details */}
            <div className="flex flex-col gap-1 mt-auto">
                <div className="flex items-center gap-1.5 opacity-90 text-[11px]">
                    <User className="h-3 w-3 flex-shrink-0 opacity-70" />
                    <span className="truncate font-medium">{teacher}</span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-black/5 pt-1 mt-0.5">
                    {timeString && (
                        <div className="flex items-center gap-1 opacity-80 font-mono text-[10px]">
                            <Clock className="w-2.5 h-2.5" />
                            {timeString}
                        </div>
                    )}
                    {room && (
                        <div className="flex items-center gap-1 bg-white/40 px-1.5 py-0.5 rounded text-[10px] font-semibold ml-auto max-w-[50%] truncate">
                            <MapPin className="w-2.5 h-2.5" />
                            {room}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleItem;
