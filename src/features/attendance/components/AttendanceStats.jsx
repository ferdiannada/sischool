import React from 'react';
import { UserCheck, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

import StatsCard from '../../../components/shared/StatsCard';

export const AttendanceStats = ({ stats }) => {
    const total = (stats.hadir || 0) + (stats.izin || 0) + (stats.sakit || 0) + (stats.alpha || 0);
    const percentage = total > 0 ? Math.round((stats.hadir / total) * 100) : 0;

    const getPercentageColor = (p) => {
        if (p >= 90) return '#10B981'; // Green
        if (p >= 75) return '#F59E0B'; // Amber
        return '#EF4444'; // Red
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Percentage Ring Card */}
            <Card className="md:col-span-1 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <UserCheck className="w-24 h-24" />
                </div>
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[220px]">
                    <div className="relative h-32 w-32 mb-4">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#f3f4f6"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke={getPercentageColor(percentage)}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${(percentage / 100) * 352} 352`}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
                            <span className="text-xs text-gray-500 font-medium">Kehadiran</span>
                        </div>
                    </div>

                    <div className="text-center z-10">
                        <h3 className="font-semibold text-gray-900">
                            {percentage >= 90 ? 'Sangat Baik!' : percentage >= 75 ? 'Cukup Baik' : 'Perlu Perhatian'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {percentage >= 90
                                ? 'Pertahankan tingkat kehadiranmu.'
                                : 'Tingkatkan kehadiran untuk hasil maksimal.'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <StatsCard
                    label="Hadir"
                    value={stats.hadir || 0}
                    icon={UserCheck}
                    color="success"
                    subtext="Tepat waktu"
                />
                <StatsCard
                    label="Izin"
                    value={stats.izin || 0}
                    icon={Clock}
                    color="warning"
                    subtext="Dengan keterangan"
                />
                <StatsCard
                    label="Sakit"
                    value={stats.sakit || 0}
                    icon={AlertCircle}
                    color="info"
                    subtext="Dengan surat dokter"
                />
                <StatsCard
                    label="Alpha"
                    value={stats.alpha || 0}
                    icon={XCircle}
                    color="danger"
                    subtext="Tanpa keterangan"
                />
            </div>
        </div>
    );
};
