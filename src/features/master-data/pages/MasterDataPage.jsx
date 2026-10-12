import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import {
    Plus, Edit, Trash2, BookOpen, School, Calendar, Loader2, RefreshCw,
    CheckCircle, GraduationCap, UserMinus, Clock, Search, Filter
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { toast } from 'react-hot-toast';
import ClassStudentsModal from '../components/ClassStudentsModal';
import {
    useClasses, useSubjects, useAcademicYears,
    useMajors, useTimeSlots, useTeachers
} from '../hooks/useMasterData';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};

const tabVariants = {
    inactive: { color: "#64748b" }, // slate-500
    active: { color: "#0f766e" }   // emerald-700
};

const MasterDataPage = () => {
    const [activeTab, setActiveTab] = useState('classes');
    const [activeDaySet, setActiveDaySet] = useState('senin_kamis');

    // Data Hooks
    const { data: kelas, isLoading: classesLoading, create: createKelas, update: updateKelas, remove: deleteKelas, unassignWaliKelas } = useClasses();
    const { data: mataPelajaran, isLoading: subjectsLoading, create: createMapel, update: updateMapel, remove: deleteMapel } = useSubjects();
    const { data: tahunAjaran, isLoading: yearsLoading, create: createTahun, update: updateTahun, setActive: setActiveTahun, remove: deleteTahun } = useAcademicYears();
    const { data: jurusan, isLoading: majorsLoading, create: createJurusan, update: updateJurusan, remove: deleteJurusan } = useMajors();
    const { data: jamPelajaran, isLoading: timeSlotsLoading, create: createJam, update: updateJam, remove: deleteJam } = useTimeSlots();
    const { data: guruData, isLoading: teachersLoading } = useTeachers();

    // Derived Data
    const guruList = guruData || [];
    const loading = classesLoading || subjectsLoading || yearsLoading || majorsLoading || timeSlotsLoading || teachersLoading;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [modalType, setModalType] = useState('kelas'); // 'kelas', 'mapel', 'tahun', 'jurusan', 'jam'
    const [editingItem, setEditingItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedKelasForStudents, setSelectedKelasForStudents] = useState(null);

    // Form states
    const [kelasForm, setKelasForm] = useState({ nama: '', tingkat: '10', jurusanId: '', waliKelasId: '', tahunAjaranId: '' });
    const [mapelForm, setMapelForm] = useState({ kode: '', nama: '', deskripsi: '' });
    const [tahunForm, setTahunForm] = useState({ nama: '', semester: 1, tanggalMulai: '', tanggalSelesai: '' });
    const [jurusanForm, setJurusanForm] = useState({ nama: '', kode: '', deskripsi: '' });
    const [jamForm, setJamForm] = useState({ urutan: 1, waktuMulai: '', waktuSelesai: '', keterangan: '', isIstirahat: false, daySet: 'senin_kamis' });

    // --- Handlers (Identical Logic to Original) ---

    // Kelas handlers
    const handleAddKelas = () => {
        const activeTa = tahunAjaran.find(ta => ta.isActive);
        setKelasForm({
            nama: '',
            tingkat: '10',
            jurusanId: '',
            waliKelasId: '',
            tahunAjaranId: activeTa ? activeTa.id : ''
        });
        setModalType('kelas');
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEditKelas = (item) => {
        setKelasForm({
            nama: item.nama,
            tingkat: item.tingkat,
            jurusanId: item.jurusanId || '',
            waliKelasId: item.waliKelasId || '',
            tahunAjaranId: item.tahunAjaranId || '',
        });
        setEditingItem(item);
        setModalType('kelas');
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSaveKelas = async () => {
        if (!kelasForm.nama) {
            toast.error('Nama kelas wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            if (modalMode === 'add') {
                await createKelas(kelasForm);
            } else {
                await updateKelas({ id: editingItem.id, data: kelasForm });
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteKelas = async (item) => {
        if (!window.confirm(`Hapus kelas ${item.nama}?`)) return;
        try {
            await deleteKelas(item.id);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleUnassignWaliKelas = async (item) => {
        if (!window.confirm(`Lepas jabatan wali kelas ${item.waliKelas} dari kelas ${item.nama}?`)) return;
        try {
            await unassignWaliKelas(item);
        } catch (error) {
            // Error handled by hook
        }
    };

    // Mata Pelajaran handlers
    const handleAddMapel = () => {
        setMapelForm({ kode: '', nama: '', deskripsi: '' });
        setModalType('mapel');
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEditMapel = (item) => {
        setMapelForm({
            kode: item.kode,
            nama: item.nama,
            deskripsi: item.deskripsi || '',
        });
        setEditingItem(item);
        setModalType('mapel');
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSaveMapel = async () => {
        if (!mapelForm.nama || !mapelForm.kode) {
            toast.error('Kode dan nama mata pelajaran wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            if (modalMode === 'add') {
                await createMapel(mapelForm);
            } else {
                await updateMapel({ id: editingItem.id, data: mapelForm });
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMapel = async (item) => {
        if (!window.confirm(`Hapus mata pelajaran ${item.nama}?`)) return;
        try {
            await deleteMapel(item.id);
        } catch (error) {
            // Error handled by hook
        }
    };

    // Jurusan handlers
    const handleAddJurusan = () => {
        setJurusanForm({ nama: '', kode: '', deskripsi: '' });
        setModalType('jurusan');
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEditJurusan = (item) => {
        setJurusanForm({
            nama: item.nama,
            kode: item.kode,
            deskripsi: item.deskripsi || '',
        });
        setEditingItem(item);
        setModalType('jurusan');
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSaveJurusan = async () => {
        if (!jurusanForm.nama || !jurusanForm.kode) {
            toast.error('Kode dan nama jurusan wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            if (modalMode === 'add') {
                await createJurusan(jurusanForm);
            } else {
                await updateJurusan({ id: editingItem.id, data: jurusanForm });
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteJurusan = async (item) => {
        if (!window.confirm(`Hapus jurusan ${item.nama}?`)) return;
        try {
            await deleteJurusan(item.id);
        } catch (error) {
            // Error handled by hook
        }
    };

    // Tahun Ajaran handlers
    const handleAddTahun = () => {
        setTahunForm({ nama: '', semester: 1, tanggalMulai: '', tanggalSelesai: '' });
        setModalType('tahun');
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEditTahun = (item) => {
        setTahunForm({
            nama: item.nama,
            semester: item.semester,
            tanggalMulai: item.tanggalMulai || '',
            tanggalSelesai: item.tanggalSelesai || '',
        });
        setEditingItem(item);
        setModalType('tahun');
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSaveTahun = async () => {
        if (!tahunForm.nama) {
            toast.error('Nama tahun ajaran wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            if (modalMode === 'add') {
                await createTahun(tahunForm);
            } else {
                await updateTahun({ id: editingItem.id, data: tahunForm });
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetActiveTahun = async (item) => {
        try {
            await setActiveTahun(item.id);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleDeleteTahun = async (item) => {
        if (!window.confirm(`Hapus tahun ajaran ${item.nama}?`)) return;
        try {
            await deleteTahun(item.id);
        } catch (error) {
            // Error handled by hook
        }
    };

    // Jam Pelajaran handlers
    const handleAddJam = () => {
        const currentSetItems = jamPelajaran.filter(j => j.daySet === activeDaySet);
        const nextUrutan = currentSetItems.length > 0 ? Math.max(...currentSetItems.map(j => j.urutan)) + 1 : 1;

        setJamForm({
            urutan: nextUrutan,
            waktuMulai: '',
            waktuSelesai: '',
            keterangan: '',
            isIstirahat: false,
            daySet: activeDaySet
        });
        setModalType('jam');
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEditJam = (item) => {
        setJamForm({
            urutan: item.urutan,
            waktuMulai: item.waktuMulai,
            waktuSelesai: item.waktuSelesai,
            keterangan: item.keterangan || '',
            isIstirahat: item.isIstirahat,
            daySet: item.daySet || 'senin_kamis',
        });
        setEditingItem(item);
        setModalType('jam');
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSaveJam = async () => {
        if (!jamForm.waktuMulai || !jamForm.waktuSelesai) {
            toast.error('Waktu mulai dan selesai wajib diisi');
            return;
        }
        setIsSubmitting(true);
        try {
            if (modalMode === 'add') {
                await createJam(jamForm);
            } else {
                await updateJam({ id: editingItem.id, data: jamForm });
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteJam = async (item) => {
        if (!window.confirm(`Hapus jam ke-${item.urutan}?`)) return;
        try {
            await deleteJam(item.id);
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleSave = () => {
        if (modalType === 'kelas') handleSaveKelas();
        else if (modalType === 'mapel') handleSaveMapel();
        else if (modalType === 'tahun') handleSaveTahun();
        else if (modalType === 'jurusan') handleSaveJurusan();
        else if (modalType === 'jam') handleSaveJam();
    };

    const getModalTitle = () => {
        const action = modalMode === 'add' ? 'Tambah' : 'Edit';
        if (modalType === 'kelas') return `${action} Kelas`;
        if (modalType === 'mapel') return `${action} Mata Pelajaran`;
        if (modalType === 'tahun') return `${action} Tahun Ajaran`;
        if (modalType === 'jurusan') return `${action} Jurusan`;
        if (modalType === 'jam') return `${action} Jam Pelajaran`;
        return '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <span className="ml-2 text-gray-500">Memuat data master...</span>
            </div>
        );
    }

    const TABS = [
        { id: 'classes', label: 'Kelas', count: kelas.length, icon: School },
        { id: 'subjects', label: 'Mata Pelajaran', count: mataPelajaran.length, icon: BookOpen },
        { id: 'years', label: 'Tahun Ajaran', count: tahunAjaran.length, icon: Calendar },
        { id: 'jurusan', label: 'Jurusan', count: jurusan.length, icon: GraduationCap },
        { id: 'jam', label: 'Jam Pelajaran', count: jamPelajaran.length, icon: Clock },
    ];

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 pb-12"
        >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 to-transparent p-6 -mx-4 sm:-mx-6 sm:rounded-2xl border-b sm:border border-emerald-100/50 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Data Master</h1>
                    <p className="text-gray-500 mt-1">Pusat kendali data referensi akademik sekolah.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()} className="gap-2 bg-white/50 backdrop-blur-sm border-gray-200">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 backdrop-blur-md rounded-2xl w-full sm:w-fit border border-gray-200/50">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 z-10",
                                isActive ? "text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                            <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-gray-400")} />
                            <span>{tab.label}</span>
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                            )}>
                                {tab.count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-gray-100">
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* KELAS TAB */}
                            {activeTab === 'classes' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Manajemen Kelas</h3>
                                        <Button onClick={handleAddKelas} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200">
                                            <Plus className="w-4 h-4" /> Tambah Kelas
                                        </Button>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-gray-50/80">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-gray-600">Nama Kelas</TableHead>
                                                    <TableHead className="font-semibold text-gray-600">Tingkat</TableHead>
                                                    <TableHead className="font-semibold text-gray-600">Jurusan</TableHead>
                                                    <TableHead className="font-semibold text-gray-600">Wali Kelas</TableHead>
                                                    <TableHead className="font-semibold text-gray-600">Siswa</TableHead>
                                                    <TableHead className="text-right font-semibold text-gray-600">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-white">
                                                {kelas.map((item, index) => (
                                                    <motion.tr
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group hover:bg-emerald-50/30 transition-colors border-b border-gray-50 last:border-none"
                                                    >
                                                        <TableCell className="font-medium text-gray-900 py-3">
                                                            <button
                                                                onClick={() => setSelectedKelasForStudents(item)}
                                                                className="hover:text-emerald-600 hover:underline transition-colors text-left font-semibold"
                                                                title="Lihat detail kelas dan siswa"
                                                            >
                                                                {item.nama}
                                                            </button>
                                                        </TableCell>
                                                        <TableCell className="py-3"><Badge variant="outline" className="bg-white">{item.tingkat}</Badge></TableCell>
                                                        <TableCell className="py-3 text-gray-500">{item.jurusan || '-'}</TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.waliKelas ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {item.waliKelas ? item.waliKelas.charAt(0) : '?'}
                                                                </div>
                                                                <span className="text-sm">{item.waliKelas || <span className="text-gray-400 italic">Belum diset</span>}</span>
                                                                {item.waliKelasId && (
                                                                    <button
                                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 rounded transition-all"
                                                                        title="Lepas Wali Kelas"
                                                                        onClick={() => handleUnassignWaliKelas(item)}
                                                                    >
                                                                        <UserMinus className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <button
                                                                onClick={() => setSelectedKelasForStudents(item)}
                                                                className="cursor-pointer transition-all hover:scale-105"
                                                                title="Lihat daftar siswa"
                                                            >
                                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none hover:bg-blue-100 cursor-pointer">{item.jumlahSiswa} Siswa</Badge>
                                                            </button>
                                                        </TableCell>
                                                        <TableCell className="text-right py-3">
                                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleEditKelas(item)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteKelas(item)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))}
                                                {kelas.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                                            Belum ada data kelas yang ditambahkan.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* MATA PELAJARAN TAB */}
                            {activeTab === 'subjects' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Daftar Mata Pelajaran</h3>
                                        <Button onClick={handleAddMapel} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200">
                                            <Plus className="w-4 h-4" /> Tambah Mapel
                                        </Button>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-gray-50/80">
                                                <TableRow>
                                                    <TableHead>Kode</TableHead>
                                                    <TableHead>Nama Mata Pelajaran</TableHead>
                                                    <TableHead>Deskripsi</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-white">
                                                {mataPelajaran.map((item, index) => (
                                                    <motion.tr
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group hover:bg-emerald-50/30 transition-colors border-b border-gray-50 last:border-none"
                                                    >
                                                        <TableCell className="font-mono text-xs font-bold text-gray-600 py-3">{item.kode}</TableCell>
                                                        <TableCell className="font-medium text-gray-900 py-3">{item.nama}</TableCell>
                                                        <TableCell className="text-gray-500 max-w-xs truncate py-3">{item.deskripsi || '-'}</TableCell>
                                                        <TableCell className="py-3">
                                                            <Badge variant={item.isActive ? 'success' : 'secondary'} className={item.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                                                                {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right py-3">
                                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleEditMapel(item)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteMapel(item)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))}
                                                {mataPelajaran.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                                            Belum ada data mata pelajaran.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* TAHUN AJARAN TAB */}
                            {activeTab === 'years' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Tahun Ajaran</h3>
                                        <Button onClick={handleAddTahun} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200">
                                            <Plus className="w-4 h-4" /> Tambah Tahun
                                        </Button>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-gray-50/80">
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>Semester</TableHead>
                                                    <TableHead>Periode</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-white">
                                                {tahunAjaran.map((item, index) => (
                                                    <motion.tr
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group hover:bg-emerald-50/30 transition-colors border-b border-gray-50 last:border-none"
                                                    >
                                                        <TableCell className="font-bold text-gray-900 py-3">{item.nama}</TableCell>
                                                        <TableCell className="py-3">Semester {item.semester}</TableCell>
                                                        <TableCell className="text-gray-500 py-3 text-sm">
                                                            {item.tanggalMulai ? new Date(item.tanggalMulai).toLocaleDateString('id-ID') : '?'} - {item.tanggalSelesai ? new Date(item.tanggalSelesai).toLocaleDateString('id-ID') : '?'}
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            {item.isActive ? (
                                                                <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-100">
                                                                    <CheckCircle className="w-4 h-4" /> Aktif
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs border-gray-200 hover:border-emerald-500 hover:text-emerald-600"
                                                                    onClick={() => handleSetActiveTahun(item)}
                                                                >
                                                                    Set Aktif
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right py-3">
                                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleEditTahun(item)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                    onClick={() => handleDeleteTahun(item)}
                                                                    disabled={item.isActive}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))}
                                                {tahunAjaran.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                                            Belum ada data tahun ajaran.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* JURUSAN TAB */}
                            {activeTab === 'jurusan' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Daftar Jurusan</h3>
                                        <Button onClick={handleAddJurusan} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200">
                                            <Plus className="w-4 h-4" /> Tambah Jurusan
                                        </Button>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-gray-50/80">
                                                <TableRow>
                                                    <TableHead>Kode</TableHead>
                                                    <TableHead>Nama Jurusan</TableHead>
                                                    <TableHead>Deskripsi</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-white">
                                                {jurusan.map((item, index) => (
                                                    <motion.tr
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group hover:bg-emerald-50/30 transition-colors border-b border-gray-50 last:border-none"
                                                    >
                                                        <TableCell className="font-mono text-gray-600 py-3">{item.kode}</TableCell>
                                                        <TableCell className="font-medium text-gray-900 py-3">{item.nama}</TableCell>
                                                        <TableCell className="text-gray-500 py-3">{item.deskripsi || '-'}</TableCell>
                                                        <TableCell className="text-right py-3">
                                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleEditJurusan(item)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteJurusan(item)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))}
                                                {jurusan.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                                                            Belum ada data jurusan.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* JAM PELAJARAN TAB */}
                            {activeTab === 'jam' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Pengaturan Jam Pelajaran</h3>
                                        <Button onClick={handleAddJam} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200">
                                            <Plus className="w-4 h-4" /> Tambah Jam
                                        </Button>
                                    </div>

                                    {/* Day Set Switcher */}
                                    <div className="p-1.5 bg-gray-100 rounded-lg w-fit flex gap-1 mb-4">
                                        <button
                                            onClick={() => setActiveDaySet('senin_kamis')}
                                            className={cn(
                                                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                                activeDaySet === 'senin_kamis' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                            )}
                                        >
                                            Senin - Kamis
                                        </button>
                                        <button
                                            onClick={() => setActiveDaySet('jumat')}
                                            className={cn(
                                                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                                activeDaySet === 'jumat' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                            )}
                                        >
                                            Jumat (Khusus)
                                        </button>
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-gray-50/80">
                                                <TableRow>
                                                    <TableHead>Urutan</TableHead>
                                                    <TableHead>Waktu</TableHead>
                                                    <TableHead>Keterangan</TableHead>
                                                    <TableHead>Tipe</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-white">
                                                {(() => {
                                                    let lessonCounter = 0;
                                                    const filteredItems = jamPelajaran.filter(j => j.daySet === activeDaySet);

                                                    if (filteredItems.length === 0) {
                                                        return (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                                                    Belum ada pengaturan jam untuk hari ini.
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    }

                                                    return filteredItems.sort((a, b) => a.urutan - b.urutan).map((item, index) => {
                                                        if (!item.isIstirahat) {
                                                            lessonCounter++;
                                                        }
                                                        const displayLabel = item.isIstirahat ? 'Istirahat' : `Jam Ke-${lessonCounter}`;

                                                        return (
                                                            <motion.tr
                                                                key={item.id}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.05 }}
                                                                className="group hover:bg-emerald-50/30 transition-colors border-b border-gray-50 last:border-none"
                                                            >
                                                                <TableCell className="font-medium text-gray-900 py-3">{displayLabel}</TableCell>
                                                                <TableCell className="font-mono py-3 font-semibold text-emerald-700">{item.waktuMulai} - {item.waktuSelesai}</TableCell>
                                                                <TableCell className="text-gray-500 py-3">{item.keterangan || '-'}</TableCell>
                                                                <TableCell className="py-3">
                                                                    <Badge variant={item.isIstirahat ? 'warning' : 'default'} className={item.isIstirahat ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                                                        {item.isIstirahat ? 'Istirahat' : 'Pelajaran'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right py-3">
                                                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleEditJam(item)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteJam(item)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </motion.tr>
                                                        );
                                                    });
                                                })()}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Card>

            {/* MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={getModalTitle()}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button onClick={handleSave} isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">Simpan</Button>
                    </>
                }
            >
                {modalType === 'kelas' && (
                    <div className="space-y-4">
                        <Input
                            label="Nama Kelas"
                            placeholder="Contoh: X IPA 1"
                            value={kelasForm.nama}
                            onChange={(e) => setKelasForm({ ...kelasForm, nama: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tingkat</label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    value={kelasForm.tingkat}
                                    onChange={(e) => setKelasForm({ ...kelasForm, tingkat: e.target.value })}
                                >
                                    <option value="10">10 (X)</option>
                                    <option value="11">11 (XI)</option>
                                    <option value="12">12 (XII)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tahun Ajaran</label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    value={kelasForm.tahunAjaranId}
                                    onChange={(e) => setKelasForm({ ...kelasForm, tahunAjaranId: e.target.value })}
                                >
                                    <option value="">-- Pilih Tahun Ajaran --</option>
                                    {tahunAjaran.map(ta => (
                                        <option key={ta.id} value={ta.id}>{ta.nama} ({ta.semester})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Jurusan</label>
                                <select
                                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    value={kelasForm.jurusanId}
                                    onChange={(e) => setKelasForm({ ...kelasForm, jurusanId: e.target.value })}
                                >
                                    <option value="">-- Pilih Jurusan --</option>
                                    {jurusan.map(j => (
                                        <option key={j.id} value={j.id}>{j.nama}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Wali Kelas</label>
                            <select
                                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={kelasForm.waliKelasId}
                                onChange={(e) => setKelasForm({ ...kelasForm, waliKelasId: e.target.value })}
                            >
                                <option value="">-- Pilih Wali Kelas --</option>
                                {guruList.map(g => {
                                    // Check assignment logic
                                    const isAssigned = kelas.some(k =>
                                        k.waliKelasId === g.id &&
                                        (modalMode === 'add' || k.id !== editingItem?.id)
                                    );

                                    return (
                                        <option
                                            key={g.id}
                                            value={g.id}
                                            disabled={isAssigned}
                                            className={isAssigned ? 'text-gray-400 bg-gray-100' : ''}
                                        >
                                            {g.full_name} {isAssigned ? '(Sudah menjabat)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                )}

                {modalType === 'mapel' && (
                    <div className="space-y-4">
                        <Input
                            label="Kode Mata Pelajaran"
                            placeholder="Contoh: MTK"
                            value={mapelForm.kode}
                            onChange={(e) => setMapelForm({ ...mapelForm, kode: e.target.value.toUpperCase() })}
                        />
                        <Input
                            label="Nama Mata Pelajaran"
                            placeholder="Contoh: Matematika"
                            value={mapelForm.nama}
                            onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })}
                        />
                        <Input
                            label="Deskripsi (Opsional)"
                            placeholder="Deskripsi singkat"
                            value={mapelForm.deskripsi}
                            onChange={(e) => setMapelForm({ ...mapelForm, deskripsi: e.target.value })}
                        />
                    </div>
                )}

                {modalType === 'tahun' && (
                    <div className="space-y-4">
                        <Input
                            label="Nama Tahun Ajaran"
                            placeholder="Contoh: 2025/2026"
                            value={tahunForm.nama}
                            onChange={(e) => setTahunForm({ ...tahunForm, nama: e.target.value })}
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Semester</label>
                            <select
                                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={tahunForm.semester}
                                onChange={(e) => setTahunForm({ ...tahunForm, semester: parseInt(e.target.value) })}
                            >
                                <option value={1}>Ganjil</option>
                                <option value={2}>Genap</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Tanggal Mulai"
                                type="date"
                                value={tahunForm.tanggalMulai}
                                onChange={(e) => setTahunForm({ ...tahunForm, tanggalMulai: e.target.value })}
                            />
                            <Input
                                label="Tanggal Selesai"
                                type="date"
                                value={tahunForm.tanggalSelesai}
                                onChange={(e) => setTahunForm({ ...tahunForm, tanggalSelesai: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {modalType === 'jurusan' && (
                    <div className="space-y-4">
                        <Input
                            label="Kode Jurusan"
                            placeholder="Contoh: IPA"
                            value={jurusanForm.kode}
                            onChange={(e) => setJurusanForm({ ...jurusanForm, kode: e.target.value.toUpperCase() })}
                        />
                        <Input
                            label="Nama Jurusan"
                            placeholder="Contoh: Ilmu Pengetahuan Alam"
                            value={jurusanForm.nama}
                            onChange={(e) => setJurusanForm({ ...jurusanForm, nama: e.target.value })}
                        />
                        <Input
                            label="Deskripsi (Opsional)"
                            placeholder="Deskripsi singkat mengenai jurusan"
                            value={jurusanForm.deskripsi}
                            onChange={(e) => setJurusanForm({ ...jurusanForm, deskripsi: e.target.value })}
                        />
                    </div>
                )}

                {modalType === 'jam' && (
                    <div className="space-y-4">
                        <Input
                            label="Urutan (Jam Ke-)"
                            type="number"
                            value={jamForm.urutan}
                            onChange={(e) => setJamForm({ ...jamForm, urutan: parseInt(e.target.value) })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Waktu Mulai"
                                type="time"
                                value={jamForm.waktuMulai}
                                onChange={(e) => setJamForm({ ...jamForm, waktuMulai: e.target.value })}
                            />
                            <Input
                                label="Waktu Selesai"
                                type="time"
                                value={jamForm.waktuSelesai}
                                onChange={(e) => setJamForm({ ...jamForm, waktuSelesai: e.target.value })}
                            />
                        </div>
                        <Input
                            label="Keterangan"
                            placeholder="Contoh: Jam Ke-1 atau Istirahat"
                            value={jamForm.keterangan}
                            onChange={(e) => setJamForm({ ...jamForm, keterangan: e.target.value })}
                        />
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="isIstirahat"
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                checked={jamForm.isIstirahat}
                                onChange={(e) => setJamForm({ ...jamForm, isIstirahat: e.target.checked })}
                            />
                            <label htmlFor="isIstirahat" className="text-sm font-medium text-gray-700">
                                Ini adalah waktu istirahat
                            </label>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Class Students Modal */}
            <ClassStudentsModal
                isOpen={!!selectedKelasForStudents}
                onClose={() => setSelectedKelasForStudents(null)}
                kelasData={selectedKelasForStudents}
            />
        </motion.div>
    );
};

export default MasterDataPage;
