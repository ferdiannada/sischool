import React from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import StatsCard from '../../../components/shared/StatsCard';

const TeacherStats = ({ users = [], stats }) => {
    let totalTeachers, activeTeachers, inactiveTeachers;

    if (stats) {
        totalTeachers = stats.total || 0;
        activeTeachers = stats.active || 0;
        inactiveTeachers = stats.inactive || 0;
    } else {
        totalTeachers = users.length;
        activeTeachers = users.filter(u => u.isActive).length;
        inactiveTeachers = totalTeachers - activeTeachers;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
                title="Total Guru"
                value={totalTeachers}
                subtext="Terdaftar dalam sistem"
                icon={Users}
                color="teal"
            />
            <StatsCard
                title="Guru Aktif"
                value={activeTeachers}
                subtext={`${totalTeachers > 0 ? ((activeTeachers / totalTeachers) * 100).toFixed(1) : 0}% dari total`}
                icon={UserCheck}
                color="emerald"
            />
            <StatsCard
                title="Non-Aktif / Cuti"
                value={inactiveTeachers}
                subtext="Tidak aktif atau cuti"
                icon={UserX}
                color="rose"
            />
        </div>
    );
};

export default TeacherStats;
