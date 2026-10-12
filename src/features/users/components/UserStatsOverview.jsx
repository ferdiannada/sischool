import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
    const colorStyles = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', iconBg: 'bg-blue-100' },
        green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', iconBg: 'bg-emerald-100' },
        red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', iconBg: 'bg-red-100' },
        purple: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', iconBg: 'bg-violet-100' },
    };

    const style = colorStyles[color] || colorStyles.blue;

    return (
        <Card className={`border ${style.border} shadow-sm hover:shadow-md transition-shadow duration-200`}>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    {trend && (
                        <div className="flex items-center mt-1 text-xs font-medium text-emerald-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {trend}
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${style.iconBg}`}>
                    <Icon className={`h-6 w-6 ${style.text}`} />
                </div>
            </CardContent>
        </Card>
    );
};

const UserStatsOverview = ({ users, stats, roleLabel }) => {
    // Prefer passed stats object, otherwise calculate (legacy fallback)
    let total, active, inactive;

    if (stats) {
        total = stats.total || 0;
        active = stats.active || 0;
        inactive = stats.inactive || 0;
    } else {
        total = users?.length || 0;
        active = users?.filter(u => u.isActive).length || 0;
        inactive = total - active;
    }

    // Calculate a dummy "new this month" for visual flair if not available
    const newThisMonth = Math.floor(total * 0.1);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard
                title={`Total ${roleLabel}`}
                value={total}
                icon={Users}
                color="blue"
            />
            <StatsCard
                title="Akun Aktif"
                value={active}
                icon={UserCheck}
                color="green"
                trend={`${Math.round((active / total || 0) * 100)}% Rate`}
            />
            <StatsCard
                title="Non-Aktif"
                value={inactive}
                icon={UserX}
                color="red"
            />
        </div>
    );
};

export default UserStatsOverview;
