import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Combobox } from '../../../../components/ui/Combobox';
import { TrendingUp, TrendingDown, GraduationCap, ArrowRight } from 'lucide-react';

const ActionCard = ({ type, title, description, icon: Icon, selected, onClick, activeColor }) => {
    // Define explicit styles based on color prop to avoid dynamic class issues
    const styles = {
        blue: {
            selected: 'border-blue-500 bg-blue-50',
            icon: 'bg-blue-500 text-white',
            text: 'text-blue-700',
            inactiveIcon: 'bg-gray-100 text-gray-500',
        },
        orange: {
            selected: 'border-orange-500 bg-orange-50',
            icon: 'bg-orange-500 text-white',
            text: 'text-orange-700',
            inactiveIcon: 'bg-gray-100 text-gray-500',
        },
        green: {
            selected: 'border-green-500 bg-green-50',
            icon: 'bg-green-500 text-white',
            text: 'text-green-700',
            inactiveIcon: 'bg-gray-100 text-gray-500',
        }
    };

    const currentStyle = styles[activeColor];
    const isSelected = selected === type;

    return (
        <div
            onClick={() => onClick(type)}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col items-center text-center gap-3 hover:shadow-md
            ${isSelected
                    ? `${currentStyle.selected} ring-1 ring-${activeColor}-200`
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
        >
            <div className={`p-4 rounded-full transition-colors ${isSelected ? currentStyle.icon : currentStyle.inactiveIcon}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <h3 className={`font-bold text-lg ${isSelected ? currentStyle.text : 'text-gray-900'}`}>{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    );
};

const StepTargetAction = ({
    actionType,
    setActionType,
    targetYearId,
    setTargetYearId,
    targetClassId,
    setTargetClassId,
    academicYears,
    targetClasses,
    targetClassesLoading
}) => {
    // Transform options for Combobox
    const yearOptions = academicYears.map(y => ({
        value: y.id,
        label: `${y.nama} (${y.semester})`
    }));

    const classOptions = targetClasses.map(c => ({
        value: c.id,
        label: `${c.nama} (Kapasitas: ${c.kapasitas})`
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">Pilih Aksi & Tujuan</h2>
                <p className="text-gray-500">Tentukan jenis proses dan kelas tujuan siswa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <ActionCard
                    type="promotion"
                    title="Naik Kelas"
                    description="Pindahkan ke jenjang lebih tinggi"
                    icon={TrendingUp}
                    selected={actionType}
                    onClick={setActionType}
                    activeColor="blue"
                />
                <ActionCard
                    type="retention"
                    title="Tinggal Kelas"
                    description="Tetap di jenjang yang sama"
                    icon={TrendingDown}
                    selected={actionType}
                    onClick={setActionType}
                    activeColor="orange"
                />
                <ActionCard
                    type="graduation"
                    title="Lulus"
                    description="Selesaikan masa studi siswa"
                    icon={GraduationCap}
                    selected={actionType}
                    onClick={setActionType}
                    activeColor="green"
                />
            </div>

            {actionType !== 'graduation' && (
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Tahun Ajaran Tujuan</label>
                            <Combobox
                                value={targetYearId}
                                onChange={setTargetYearId}
                                options={yearOptions}
                                placeholder="Pilih Tahun..."
                                emptyMessage="Tidak ada tahun ajaran."
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Kelas Tujuan</label>
                            <Combobox
                                value={targetClassId}
                                onChange={setTargetClassId}
                                options={classOptions}
                                placeholder={targetClassesLoading ? "Memuat..." : "Pilih Kelas Tujuan..."}
                                disabled={!targetYearId || targetClassesLoading}
                                emptyMessage="Tidak ada kelas."
                                className={!targetYearId ? "opacity-60 bg-gray-50" : ""}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepTargetAction;
