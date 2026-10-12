import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const AttendanceCalendar = ({
    month,
    year,
    history,
    onPrevMonth,
    onNextMonth,
    isCurrentMonth,
    onSelectDate
}) => {

    // Map history to date string for easy lookup
    // Assuming history items have a 'tanggal' field like "2023-10-25"
    const attendanceMap = history.reduce((acc, item) => {
        const dateStr = new Date(item.tanggal).toISOString().split('T')[0];
        acc[dateStr] = item;
        return acc;
    }, {});

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

    // Adjust for Monday start if needed, but let's stick to Sunday start for standard view or Monday?
    // Let's use Sunday start for simplicity, standard calendar

    const days = [];

    // Fill previous month padding
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }

    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'hadir': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
            case 'izin': return 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200';
            case 'sakit': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
            case 'alpha': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
            default: return 'hover:bg-gray-50';
        }
    };

    const MONTH_NAMES = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {MONTH_NAMES[month - 1]} {year}
                    </h2>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={onPrevMonth} className="h-8 w-8 p-0 rounded-full">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onNextMonth}
                            disabled={isCurrentMonth}
                            className="h-8 w-8 p-0 rounded-full"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Legend - Hidden on small screens */}
                <div className="hidden md:flex gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        <span>Hadir</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Izin</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <span>Sakit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span>Alpha</span>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                <div className="grid grid-cols-7 gap-1 md:gap-2 text-center mb-2">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                        <div key={d} className="text-xs font-semibold text-gray-400 py-2">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {days.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="aspect-square"></div>;

                        // Construct date string YYYY-MM-DD padded
                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const attendance = attendanceMap[dateStr];
                        const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();

                        return (
                            <button
                                key={day}
                                onClick={() => attendance && onSelectDate(attendance)}
                                className={`
                                    relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all
                                    border border-transparent
                                    ${isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                                    ${attendance ? getStatusColor(attendance.status) : 'bg-gray-50 text-gray-400'}
                                    ${attendance ? 'cursor-pointer scale-100 hover:scale-[1.02] hover:shadow-sm' : 'cursor-default'}
                                `}
                            >
                                <span className={`text-sm md:text-base font-medium ${attendance ? '' : 'opacity-50'}`}>
                                    {day}
                                </span>

                                {/* Status Indicator Dot for mobile or small views */}
                                {attendance && (
                                    <div className="absolute bottom-2 flex gap-0.5">
                                        <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-current opacity-60`}></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Legend */}
            <div className="md:hidden p-4 border-t border-gray-100 bg-gray-50 text-xs flex justify-between px-6">
                <span className="text-green-600 font-medium">Hadir</span>
                <span className="text-amber-600 font-medium">Izin</span>
                <span className="text-blue-600 font-medium">Sakit</span>
                <span className="text-red-600 font-medium">Alpha</span>
            </div>
        </div>
    );
};
