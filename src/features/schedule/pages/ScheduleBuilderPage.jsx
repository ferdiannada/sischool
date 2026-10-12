import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';

import { Modal } from '../../../components/ui/Modal';
import { Plus, RefreshCw, Users, Monitor, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { scheduleAPI } from '@/features/schedule/api/scheduleAPI';
import ScheduleItem from '../components/ScheduleItem';
import { useScheduleData } from '../hooks/useScheduleData';

const HARI_OPTIONS = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
];

/**
 * Schedule Builder Page (Admin)
 * Enhanced with Weekly Grid View and Custom Hooks
 */
const ScheduleBuilderPage = () => {
    // Custom Hook handles fetching and state
    const {
        schedules,
        kelasList,
        mapelList,
        guruList,
        jamPelajaran,
        isLoadingRefs,
        isLoadingSchedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        isCreating
    } = useScheduleData();

    // Local UI State
    const [regularJam, setRegularJam] = useState([]);
    const [fridayJam, setFridayJam] = useState([]);
    const [viewMode, setViewMode] = useState('class');
    const [selectedEntityId, setSelectedEntityId] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingItem, setEditingItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        kelasId: '',
        mapelId: '',
        guruId: '',
        hari: 1,
        jamMulai: '07:00',
        jamSelesai: '08:30',
        ruangan: '',
    });

    // Process Slots (Memoized)
    useEffect(() => {
        if (jamPelajaran.length > 0) {
            const sortedJam = [...jamPelajaran].sort((a, b) => a.urutan - b.urutan);
            const processSet = (items) => {
                let counter = 0;
                return items.map(j => {
                    if (!j.isIstirahat) counter++;
                    return { ...j, lessonIndex: counter };
                });
            };
            const regular = sortedJam.filter(j => j.daySet === 'senin_kamis' || !j.daySet);
            const friday = sortedJam.filter(j => j.daySet === 'jumat');
            setRegularJam(processSet(regular));
            setFridayJam(processSet(friday));
        }
    }, [jamPelajaran]);

    // Set default selection
    useEffect(() => {
        if (!selectedEntityId && !isLoadingRefs) {
            if (viewMode === 'class' && kelasList.length > 0) setSelectedEntityId(kelasList[0].id);
            if (viewMode === 'teacher' && guruList.length > 0) setSelectedEntityId(guruList[0].id);
        }
    }, [kelasList, guruList, viewMode, isLoadingRefs, selectedEntityId]);

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            if (viewMode === 'class') return s.kelasId === parseInt(selectedEntityId);
            if (viewMode === 'teacher') return s.guruId === parseInt(selectedEntityId);
            return false;
        });
    }, [schedules, viewMode, selectedEntityId]);

    // Pre-calculate Grid Rows
    const { rows, rowMapping } = useMemo(() => {
        const maxUrutan = Math.max(
            ...regularJam.map(j => j.urutan),
            ...fridayJam.map(j => j.urutan),
            0
        );

        const generatedRows = [];
        const mapping = {};

        for (let i = 1; i <= maxUrutan; i++) {
            const reg = regularJam.find(j => j.urutan === i);
            const fri = fridayJam.find(j => j.urutan === i);
            const displaySlot = reg || fri;

            if (!displaySlot) continue;

            const gridRowIndex = generatedRows.length + 2;
            generatedRows.push({ urutan: i, reg, fri, displaySlot, gridRowIndex });
            mapping[i] = gridRowIndex;
        }
        return { rows: generatedRows, rowMapping: mapping };
    }, [regularJam, fridayJam]);

    // Available Slots Logic
    const { availableStartSlots, availableEndSlots } = useMemo(() => {
        const currentSlots = (form.hari === 5) ? fridayJam : regularJam;

        if (!form.kelasId || !form.hari || currentSlots.length === 0) {
            return {
                availableStartSlots: currentSlots.filter(j => !j.isIstirahat),
                availableEndSlots: currentSlots.filter(j => !j.isIstirahat)
            };
        }

        const occupied = schedules
            .filter(s =>
                s.kelasId === form.kelasId &&
                s.hari === form.hari &&
                s.id !== editingItem?.id
            )
            .map(s => ({
                start: s.jamMulai.slice(0, 5),
                end: s.jamSelesai.slice(0, 5)
            }))
            .sort((a, b) => a.start.localeCompare(b.start));

        const isOccupied = (time) => occupied.some(range => time >= range.start && time < range.end);

        const startSlots = currentSlots.filter(slot => {
            if (slot.isIstirahat) return false;
            return !isOccupied(slot.waktuMulai);
        });

        let endSlots = [];
        if (form.jamMulai) {
            const currentStart = form.jamMulai.slice(0, 5);
            const nextOccupiedStart = occupied.find(range => range.start > currentStart)?.start || '24:00';

            endSlots = currentSlots.filter(slot => {
                if (slot.isIstirahat) return false;
                const slotEnd = slot.waktuSelesai.slice(0, 5);
                const slotStart = slot.waktuMulai.slice(0, 5);
                if (slotStart < currentStart) return false;
                if (slotEnd <= currentStart) return false;
                if (slotEnd > nextOccupiedStart) return false;
                return true;
            });
        }
        return { availableStartSlots: startSlots, availableEndSlots: endSlots };
    }, [schedules, form.kelasId, form.hari, form.jamMulai, editingItem, regularJam, fridayJam]);

    // Auto-update times
    useEffect(() => {
        if (availableStartSlots.length > 0) {
            const isCurrentValid = availableStartSlots.some(slot => slot.waktuMulai === form.jamMulai);
            if (!isCurrentValid) setForm(prev => ({ ...prev, jamMulai: availableStartSlots[0].waktuMulai }));
        }
    }, [availableStartSlots, form.jamMulai]);

    useEffect(() => {
        if (availableEndSlots.length > 0) {
            const isCurrentValid = availableEndSlots.some(slot => slot.waktuSelesai === form.jamSelesai);
            if (!isCurrentValid) setForm(prev => ({ ...prev, jamSelesai: availableEndSlots[0].waktuSelesai }));
        }
    }, [availableEndSlots, form.jamSelesai]);

    // Handlers
    const handleAdd = (hari = 1, jam = '07:00') => {
        const currentSlots = (hari === 5) ? fridayJam : regularJam;
        const slot = currentSlots.find(j => j.waktuMulai === jam);
        const defaultEnd = slot ? slot.waktuSelesai : '07:45';

        setForm({
            kelasId: viewMode === 'class' ? parseInt(selectedEntityId) : (kelasList[0]?.id || ''),
            mapelId: mapelList[0]?.id || '',
            guruId: viewMode === 'teacher' ? parseInt(selectedEntityId) : (guruList[0]?.id || ''),
            hari,
            jamMulai: jam,
            jamSelesai: defaultEnd,
            ruangan: '',
        });
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setForm({
            kelasId: item.kelasId,
            mapelId: item.mapelId,
            guruId: item.guruId,
            hari: item.hari,
            jamMulai: item.jamMulai?.slice(0, 5) || '07:00',
            jamSelesai: item.jamSelesai?.slice(0, 5) || '08:30',
            ruangan: item.ruangan || '',
        });
        setEditingItem(item);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.kelasId || !form.mapelId || !form.guruId) {
            toast.error('Semua field wajib diisi');
            return;
        }

        setIsSubmitting(true);
        try {
            const conflictMsg = await scheduleAPI.checkConflict(form, editingItem?.id);
            if (conflictMsg) {
                toast.error(conflictMsg);
                return;
            }

            if (modalMode === 'add') {
                await createSchedule(form);
            } else {
                await updateSchedule({ id: editingItem.id, data: form });
            }
            setIsModalOpen(false);
        } catch (error) {
            // Error handled by hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Hapus jadwal ${item.mapelNama}?`)) return;
        await deleteSchedule(item.id);
    };

    if (isLoadingRefs) return <div className="p-8 text-center text-gray-500">Memuat data referensi...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Penjadwalan Premium</h1>
                    <p className="text-gray-500">Atur jadwal dengan Tampilan Grid Interaktif.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => handleAdd()} disabled={isLoadingSchedules}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Manual
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-6">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Mode Tampilan</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'class' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                                    onClick={() => { setViewMode('class'); setSelectedEntityId(kelasList[0]?.id || '') }}
                                >
                                    <Users className="w-4 h-4 inline mr-2" /> Per Kelas
                                </button>
                                <button
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'teacher' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
                                    onClick={() => { setViewMode('teacher'); setSelectedEntityId(guruList[0]?.id || '') }}
                                >
                                    <Monitor className="w-4 h-4 inline mr-2" /> Per Guru
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 max-w-sm">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                                {viewMode === 'class' ? 'Pilih Kelas' : 'Pilih Guru'}
                            </label>
                            <Combobox
                                value={selectedEntityId}
                                onChange={(val) => setSelectedEntityId(val)}
                                options={viewMode === 'class'
                                    ? kelasList.map(k => ({ value: k.id, label: k.nama }))
                                    : guruList.map(g => ({ value: g.id, label: g.nama }))
                                }
                                placeholder={viewMode === 'class' ? "Cari Kelas..." : "Cari Guru..."}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm relative">
                {isLoadingSchedules && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="text-sm font-medium text-indigo-600">Memuat Grid Jadwal...</span>
                        </div>
                    </div>
                )}
                <div className="min-w-[1000px] bg-white">
                    <div className="grid gap-[1px] bg-gray-200" style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gridAutoRows: 'minmax(80px, auto)' }}>
                        <div className="bg-gray-50 p-3 flex items-center justify-center font-bold text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-20">Jam</div>
                        {HARI_OPTIONS.map(day => (
                            <div key={day.value} className="bg-gray-50 p-3 flex items-center justify-center font-bold text-gray-700 text-sm uppercase tracking-wider sticky top-0 z-20">
                                {day.label}
                            </div>
                        ))}

                        {rows.map((row) => {
                            const rowStart = row.gridRowIndex;
                            return (
                                <React.Fragment key={`row-${row.urutan}`}>
                                    <div className="bg-white flex flex-col items-center justify-center p-2 text-xs text-gray-500 font-mono border-r border-gray-100" style={{ gridColumn: 1, gridRow: rowStart }}>
                                        <span className="font-bold text-gray-800 text-sm">{row.reg?.waktuMulai || row.fri?.waktuMulai}</span>
                                        <span className="text-[10px] text-gray-400">{row.reg?.waktuSelesai || row.fri?.waktuSelesai}</span>
                                        <span className="mt-1.5 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                                            {row.reg?.lessonIndex ? `Jam Ke-${row.reg.lessonIndex}` : (row.reg?.isIstirahat ? 'Istirahat' : '')}
                                        </span>
                                    </div>
                                    {HARI_OPTIONS.map(day => {
                                        const isFriday = day.value === 5;
                                        const currentSlot = isFriday ? row.fri : row.reg;
                                        if (!currentSlot) return <div key={`empty-${day.value}-${row.urutan}`} className="bg-gray-50/30 border-r border-b border-gray-50" style={{ gridColumn: day.value + 1, gridRow: rowStart }} />;

                                        if (currentSlot.isIstirahat) {
                                            return (
                                                <div key={`break-${day.value}-${row.urutan}`} className="bg-orange-50 relative z-20 flex items-center justify-center text-orange-400 text-xs italic tracking-wide border-r border-b border-orange-200" style={{ gridColumn: day.value + 1, gridRow: rowStart }}>
                                                    <span>☕ {currentSlot.keterangan || 'ISTIRAHAT'}</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={`empty-${day.value}-${row.urutan}`} className="bg-white hover:bg-gray-50/80 transition-colors relative group border-r border-b border-gray-50" style={{ gridColumn: day.value + 1, gridRow: rowStart }} onClick={() => handleAdd(day.value, currentSlot.waktuMulai)}>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 shadow-sm"><Plus className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}

                        {filteredSchedules.map(schedule => {
                            const isFriday = schedule.hari === 5;
                            const currentSet = isFriday ? fridayJam : regularJam;
                            const targetStart = schedule.jamMulai.slice(0, 5);
                            const targetEnd = schedule.jamSelesai.slice(0, 5);

                            const coveredSlots = [];
                            const startIndex = currentSet.findIndex(j => j.waktuMulai === targetStart);
                            if (startIndex !== -1) {
                                for (let i = startIndex; i < currentSet.length; i++) {
                                    const slot = currentSet[i];
                                    if (slot.waktuMulai >= targetEnd) break;
                                    coveredSlots.push(slot);
                                    if (slot.waktuSelesai >= targetEnd) break;
                                }
                            }
                            if (coveredSlots.length === 0) return null;

                            const segments = [];
                            let currentSegment = [];
                            coveredSlots.forEach(slot => {
                                if (slot.isIstirahat) {
                                    if (currentSegment.length > 0) { segments.push(currentSegment); currentSegment = []; }
                                } else { currentSegment.push(slot); }
                            });
                            if (currentSegment.length > 0) segments.push(currentSegment);

                            return segments.map((segment, segIndex) => {
                                const startSlot = segment[0];
                                const endSlot = segment[segment.length - 1];
                                const rowStart = rowMapping[startSlot.urutan];
                                if (!rowStart) return null;
                                const rowEnd = rowMapping[endSlot.urutan] + 1;

                                return (
                                    <div key={`${schedule.id}-${segIndex}`} className="m-1 z-10 relative" style={{ gridColumn: schedule.hari + 1, gridRow: `${rowStart} / ${rowEnd}` }}>
                                        <ScheduleItem
                                            subject={schedule.mapelNama}
                                            teacher={viewMode === 'class' ? schedule.guruNama : schedule.kelasNama}
                                            room={schedule.ruangan}
                                            timeString={`${startSlot.waktuMulai} - ${endSlot.waktuSelesai}`}
                                            onClick={() => handleEdit(schedule)}
                                            onDelete={() => handleDelete(schedule)}
                                        />
                                    </div>
                                );
                            });
                        })}
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Tambah Jadwal Baru' : 'Edit Jadwal'}
                footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button><Button onClick={handleSave} isLoading={isSubmitting || isCreating} disabled={availableStartSlots.length === 0}>Simpan</Button></>}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kelas *</label>
                            <Combobox value={form.kelasId} onChange={(val) => setForm({ ...form, kelasId: parseInt(val) })} options={kelasList.map(k => ({ value: k.id, label: k.nama }))} placeholder="Pilih Kelas..." disabled={viewMode === 'class' && modalMode === 'add'} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Hari *</label>
                            <select className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" value={form.hari} onChange={(e) => setForm({ ...form, hari: parseInt(e.target.value) })}>{HARI_OPTIONS.map(h => (<option key={h.value} value={h.value}>{h.label}</option>))}</select>
                        </div>
                    </div>
                    <div className="space-y-2"><label className="text-sm font-medium">Mata Pelajaran *</label><Combobox value={form.mapelId} onChange={(val) => setForm({ ...form, mapelId: parseInt(val) })} options={mapelList.map(m => ({ value: m.id, label: `[${m.kode}] ${m.nama}` }))} placeholder="Pilih Mata Pelajaran..." /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Guru Pengajar *</label><Combobox value={form.guruId} onChange={(val) => setForm({ ...form, guruId: parseInt(val) })} options={guruList.map(g => ({ value: g.id, label: g.nama }))} placeholder="Pilih Guru..." disabled={viewMode === 'teacher' && modalMode === 'add'} /></div>
                    {availableStartSlots.length === 0 && (<div className="bg-orange-50 text-orange-600 p-3 rounded-md text-sm border border-orange-200 flex items-center gap-2"><AlertCircle className="w-4 h-4" /><span>Alokasi jam pelajaran di hari ini sudah penuh.</span></div>)}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-sm font-medium">Jam Mulai *</label><select className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400" value={form.jamMulai} onChange={(e) => setForm({ ...form, jamMulai: e.target.value })} disabled={availableStartSlots.length === 0}>{availableStartSlots.map(slot => (<option key={`start-${slot.id}`} value={slot.waktuMulai}>{slot.waktuMulai} ({slot.isIstirahat ? 'Istirahat' : `Jam ke-${slot.lessonIndex}`})</option>))}</select></div>
                        <div className="space-y-2"><label className="text-sm font-medium">Jam Selesai *</label><select className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400" value={form.jamSelesai} onChange={(e) => setForm({ ...form, jamSelesai: e.target.value })} disabled={availableStartSlots.length === 0}>{availableEndSlots.map(slot => (<option key={`end-${slot.id}`} value={slot.waktuSelesai}>{slot.waktuSelesai} ({slot.isIstirahat ? 'Istirahat' : `Jam ke-${slot.lessonIndex}`})</option>))}</select></div>
                    </div>
                    <Input label="Ruangan (Opsional)" placeholder="Contoh: Lab Komputer" value={form.ruangan} onChange={(e) => setForm({ ...form, ruangan: e.target.value })} />
                </div>
            </Modal>
        </div>
    );
};

export default ScheduleBuilderPage;
