import React from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import StatsCard from '../../../components/shared/StatsCard';

const StudentStats = ({ users = [], stats }) => {
    let total, active, inactive;

    if (stats) {
        total = stats.total || 0;
        active = stats.active || 0;
        inactive = stats.inactive || 0;
    } else {
        total = users.length;
        active = users.filter(u => u.isActive).length;
        inactive = total - active;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
                title="Total Siswa"
                value={total}
                icon={Users}
                color="blue"
                subtext="Terdaftar dalam sistem"
            />
            <StatsCard
                title="Siswa Aktif"
                value={active}
                icon={UserCheck}
                color="emerald"
                subtext={`${((active / total || 0) * 100).toFixed(1)}% dari total`}
            />
            <StatsCard
                title="Non-Aktif / Alumni"
                value={inactive}
                icon={UserX}
                color="rose"
                subtext="Tidak aktif atau lulus"
            />
        </div>
    );
};

export default StudentStats;
