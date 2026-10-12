import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Combobox } from '../../../../components/ui/Combobox';
import { Users, Calendar, School } from 'lucide-react';

const StepSourceSelection = ({
    academicYears,
    sourceClasses,
    sourceYearId,
    setSourceYearId,
    sourceClassId,
    setSourceClassId
}) => {
    // Transform options for Combobox
    const yearOptions = academicYears.map(y => ({
        value: y.id,
        label: `${y.nama} (${y.semester})`
    }));

    const classOptions = sourceClasses.map(c => ({
        value: c.id,
        label: `${c.nama} (${c.student_count || 0} Siswa)`
    }));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">Pilih Kelas Asal</h2>
                <p className="text-gray-500">Tentukan tahun ajaran dan kelas yang akan diproses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Year Selection */}
                <Card className={`p-6 border-2 transition-all ${sourceYearId ? 'border-primary-500 ring-4 ring-primary-50 bg-primary-50/20' : 'border-dashed border-gray-200 hover:border-primary-200'}`}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-lg text-primary-600">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Tahun Ajaran</h3>
                        </div>
                        <Combobox
                            value={sourceYearId}
                            onChange={setSourceYearId}
                            options={yearOptions}
                            placeholder="Pilih Tahun Ajaran..."
                            className="bg-white"
                        />
                    </div>
                </Card>

                {/* Class Selection */}
                <Card className={`p-6 border-2 transition-all ${sourceClassId ? 'border-indigo-500 ring-4 ring-indigo-50 bg-indigo-50/20' : 'border-dashed border-gray-200 hover:border-indigo-200'} ${!sourceYearId ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-lg text-indigo-600">
                                <School className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Kelas Asal</h3>
                        </div>
                        <Combobox
                            value={sourceClassId}
                            onChange={setSourceClassId}
                            options={classOptions}
                            disabled={!sourceYearId}
                            placeholder={!sourceYearId ? "Pilih Tahun dulu..." : "Pilih Kelas..."}
                            emptyMessage="Tidak ada kelas."
                            className="bg-white"
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StepSourceSelection;
