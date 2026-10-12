import React, { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Bell, Check, Clock, Wallet, BookOpen, Info, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const NotificationsPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all'); // all, unread, attendance, billing

    // Use Custom Hook with Polling & Optimistic Updates
    const {
        notifications,
        isLoading,
        markAsRead,
        markAllAsRead
    } = useNotifications(user?.id);

    const handleMarkRead = (notifId, e) => {
        if (e) e.stopPropagation();
        markAsRead(notifId);
    };

    const handleMarkAllRead = () => {
        markAllAsRead();
    };

    const handleCardClick = (notif) => {
        if (!notif.is_read) {
            handleMarkRead(notif.id);
        }

        // Navigate based on category
        // Note: reference_id comes from notif.data in the new schema, but we can rely on category for main navigation
        if (notif.category === 'billing') {
            navigate('/wali-murid/tagihan');
        } else if (notif.category === 'attendance') {
            navigate('/wali-murid/kehadiran');
        }
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            if (activeTab === 'unread') return !n.is_read;
            if (activeTab === 'attendance') return n.category === 'attendance';
            if (activeTab === 'billing') return n.category === 'billing';
            return true;
        });
    }, [notifications, activeTab]);

    const groupedNotifications = useMemo(() => {
        const groups = {
            'Hari Ini': [],
            'Kemarin': [],
            'Minggu Ini': [],
            'Lebih Lama': []
        };

        filteredNotifications.forEach(n => {
            const date = new Date(n.created_at);
            if (isToday(date)) groups['Hari Ini'].push(n);
            else if (isYesterday(date)) groups['Kemarin'].push(n);
            else if (isThisWeek(date)) groups['Minggu Ini'].push(n);
            else groups['Lebih Lama'].push(n);
        });

        // Remove empty groups
        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [filteredNotifications]);

    const getIcon = (type, category) => {
        if (category === 'billing') return <Wallet className="h-5 w-5" />;
        if (category === 'attendance') return <Calendar className="h-5 w-5" />;
        if (category === 'academic') return <BookOpen className="h-5 w-5" />;

        switch (type) {
            case 'danger': return <AlertCircle className="h-5 w-5" />;
            case 'warning': return <AlertTriangle className="h-5 w-5" />;
            case 'success': return <Check className="h-5 w-5" />;
            default: return <Info className="h-5 w-5" />;
        }
    };

    const getIconStyles = (type, category) => {
        if (category === 'billing') return 'bg-purple-100 text-purple-600';
        if (category === 'attendance') {
            // Differentiate attendance status colors if possible via type
            if (type === 'danger') return 'bg-red-100 text-red-600'; // Alpha
            return 'bg-blue-100 text-blue-600';
        }

        switch (type) {
            case 'danger': return 'bg-red-100 text-red-600';
            case 'warning': return 'bg-amber-100 text-amber-600';
            case 'success': return 'bg-green-100 text-green-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifikasi</h1>
                    <p className="text-gray-500">Update terbaru aktivitas sekolah.</p>
                </div>
                <div className="flex items-center gap-3">
                    {notifications.some(n => !n.is_read) && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                            <Check className="mr-2 h-4 w-4" /> Tandai Semua Dibaca
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-1">
                {[
                    { id: 'all', label: 'Semua' },
                    { id: 'unread', label: 'Belum Dibaca', count: notifications.filter(n => !n.is_read).length },
                    { id: 'attendance', label: 'Kehadiran' },
                    { id: 'billing', label: 'Keuangan' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                            ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 transform scale-105'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 bg-white border border-gray-200'}
                        `}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="space-y-8">
                {groupedNotifications.length > 0 ? (
                    groupedNotifications.map(([group, items]) => (
                        <div key={group} className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">{group}</h3>
                            <div className="space-y-3">
                                {items.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleCardClick(notif)}
                                        className={`
                                            group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer
                                            ${notif.is_read
                                                ? 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                                : 'bg-blue-50/30 border-blue-100 hover:border-blue-300 shadow-sm shadow-blue-100/50'}
                                        `}
                                    >
                                        {/* Unread Indicator Line */}
                                        {!notif.is_read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>
                                        )}

                                        <div className="p-4 flex gap-4 items-start">
                                            {/* Icon Box */}
                                            <div className={`
                                                mt-1 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                                                transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                                                ${getIconStyles(notif.type, notif.category)}
                                            `}>
                                                {getIcon(notif.type, notif.category)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className={`text-base font-semibold truncate pr-2 ${notif.is_read ? 'text-gray-700' : 'text-gray-900 group-hover:text-primary-700 transition-colors'}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: idLocale })}
                                                    </span>
                                                </div>

                                                <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-gray-500' : 'text-gray-700'}`}>
                                                    {notif.message}
                                                </p>

                                                {/* Meta / Actions Row */}
                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        {/* Category Badge */}
                                                        <span className={`
                                                            text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wide
                                                            ${notif.category === 'billing' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                                notif.category === 'attendance' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                    'bg-gray-50 text-gray-500 border border-gray-100'}
                                                        `}>
                                                            {notif.category === 'billing' ? 'Keuangan' : notif.category === 'attendance' ? 'Kehadiran' : 'Umum'}
                                                        </span>

                                                        {!notif.is_read && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 border border-primary-200">
                                                                BARU
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Hover Action hint */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary-600 font-medium flex items-center">
                                                        Lihat Detail →
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Bell className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Belum ada notifikasi</h3>
                        <p className="text-gray-500 mt-1 max-w-sm">
                            {activeTab === 'all'
                                ? 'Saat ini belum ada pemberitahuan baru untuk Anda.'
                                : `Tidak ada notifikasi di kategori "${activeTab}".`}
                        </p>
                        {activeTab !== 'all' && (
                            <Button variant="link" onClick={() => setActiveTab('all')} className="mt-2 text-primary-600">
                                Lihat Semua Notifikasi
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
