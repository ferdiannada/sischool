import {
    LayoutDashboard, Users, BookOpen, Calendar, FileText, Settings,
    ClipboardCheck, History, User, CheckSquare, Bell, ClipboardList,
    CreditCard, ScrollText, Wallet, BarChart3
} from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    {
        label: 'Manajemen User',
        icon: Users,
        children: [
            { label: 'Siswa', path: '/admin/users/siswa' },
            { label: 'Guru', path: '/admin/users/guru' },
            { label: 'Tata Usaha', path: '/admin/users/tu' },
            { label: 'Admin', path: '/admin/users/admin' },
            { label: 'Kenaikan Kelas', path: '/admin/users/promotion', icon: CheckSquare },
        ]
    },
    { label: 'Data Master', path: '/admin/master', icon: BookOpen },
    { label: 'Penjadwalan', path: '/admin/schedule', icon: Calendar },
    { label: 'Laporan', path: '/admin/reports', icon: FileText },
    { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
];

export const GURU_NAV_ITEMS = [
    { label: 'Dashboard', path: '/guru/dashboard', icon: LayoutDashboard },
    { label: 'Jadwal Mengajar', path: '/guru/jadwal', icon: Calendar },
    { label: 'Input Absensi', path: '/guru/absensi', icon: ClipboardCheck },
    { label: 'Rekap Kehadiran', path: '/guru/rekap', icon: History },
    { label: 'Profil', path: '/guru/profil', icon: User },
];

export const WALI_KELAS_NAV_ITEMS = [
    { label: 'Dashboard', path: '/wali-kelas/dashboard', icon: LayoutDashboard },
    { label: 'Kelas Saya', path: '/wali-kelas/kelas', icon: Users },
    { label: 'Monitoring Absensi', path: '/wali-kelas/monitoring', icon: ClipboardList },
    { label: 'Laporan', path: '/wali-kelas/laporan', icon: FileText },
    { label: 'Profil', path: '/wali-kelas/profil', icon: User },
];

export const KETUA_KELAS_NAV_ITEMS = [
    { label: 'Dashboard', path: '/ketua-kelas/dashboard', icon: LayoutDashboard },
    { label: 'Input Absensi', path: '/ketua-kelas/absensi', icon: CheckSquare },
    { label: 'Jadwal Kelas', path: '/ketua-kelas/jadwal', icon: Calendar },
    { label: 'Teman Sekelas', path: '/ketua-kelas/teman', icon: Users },
    { label: 'Profil', path: '/ketua-kelas/profil', icon: User },
];

export const SISWA_NAV_ITEMS = [
    { label: 'Dashboard', path: '/siswa/dashboard', icon: LayoutDashboard },
    { label: 'Jadwal Pelajaran', path: '/siswa/jadwal', icon: Calendar },
    { label: 'Riwayat Kehadiran', path: '/siswa/kehadiran', icon: FileText },
    { label: 'Profil', path: '/siswa/profil', icon: User },
];

export const WALI_MURID_NAV_ITEMS = [
    { label: 'Dashboard', path: '/wali-murid/dashboard', icon: LayoutDashboard },
    { label: 'Profil Anak', path: '/wali-murid/anak', icon: User },
    { label: 'Kehadiran', path: '/wali-murid/kehadiran', icon: Calendar },
    { label: 'Tagihan', path: '/wali-murid/tagihan', icon: CreditCard },
    { label: 'Notifikasi', path: '/wali-murid/notifikasi', icon: Bell },
    { label: 'Profil Saya', path: '/wali-murid/profil', icon: User },
];

export const TU_NAV_ITEMS = [
    { label: 'Dashboard', path: '/tu/dashboard', icon: LayoutDashboard },
    { label: 'Pembayaran', path: '/tu/pembayaran', icon: CreditCard },
    { label: 'Tagihan', path: '/tu/tagihan', icon: ScrollText },
    { label: 'Master Data', path: '/tu/master-pembayaran', icon: BookOpen },
    { label: 'Pengeluaran', path: '/tu/pengeluaran', icon: Wallet },
    { label: 'Laporan', path: '/tu/laporan', icon: BarChart3 },
    { label: 'Pengaturan', path: '/tu/settings', icon: Settings },
];
