import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, ArrowLeft, CheckSquare, Square, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Badge } from '../../../../components/ui/Badge';

const StudentItem = ({ student, isSelected, onClick }) => (
    <div
        onClick={() => onClick(student.id)}
        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all hover:shadow-sm
        ${isSelected
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300 z-10'
                : 'bg-white border-gray-100 hover:border-blue-200'
            }`}
    >
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{student.users?.full_name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{student.nis}</span>
                    <span>•</span>
                    <span className={`capitalize ${student.status === 'aktif' ? 'text-green-600' : 'text-gray-500'}`}>{student.status}</span>
                </div>
            </div>
        </div>
    </div>
);

const StepStudentSelection = ({
    students,
    selectedStudentIds,
    setSelectedStudentIds
}) => {
    const [searchLeft, setSearchLeft] = useState('');
    const [searchRight, setSearchRight] = useState('');

    // Filter students
    const availableStudents = useMemo(() => {
        return students.filter(s => !selectedStudentIds.includes(s.id));
    }, [students, selectedStudentIds]);

    const selectedStudentsList = useMemo(() => {
        return students.filter(s => selectedStudentIds.includes(s.id));
    }, [students, selectedStudentIds]);

    const filteredAvailable = availableStudents.filter(s =>
        s.users?.full_name?.toLowerCase().includes(searchLeft.toLowerCase()) ||
        s.nis?.includes(searchLeft)
    );

    const filteredSelected = selectedStudentsList.filter(s =>
        s.users?.full_name?.toLowerCase().includes(searchRight.toLowerCase()) ||
        s.nis?.includes(searchRight)
    );

    const handleMoveAllRight = () => {
        const idsToAdd = filteredAvailable.map(s => s.id);
        setSelectedStudentIds(prev => [...prev, ...idsToAdd]);
    };

    const handleMoveAllLeft = () => {
        const idsToRemove = filteredSelected.map(s => s.id);
        setSelectedStudentIds(prev => prev.filter(id => !idsToRemove.includes(id)));
    };

    const handleItemClick = (id, isSelected) => {
        if (isSelected) {
            setSelectedStudentIds(prev => prev.filter(sId => sId !== id));
        } else {
            setSelectedStudentIds(prev => [...prev, id]);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">Pilih Siswa</h2>
                <p className="text-gray-500">Pindahkan siswa yang akan diproses ke daftar Kanan.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                {/* Available List (Left) */}
                <div className="flex flex-col h-full bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-700">Daftar Siswa ({availableStudents.length})</h3>
                            <button onClick={handleMoveAllRight} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                Pilih Semua
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari nama atau NIS..."
                                className="pl-9 h-9 bg-gray-50 border-gray-200"
                                value={searchLeft}
                                onChange={(e) => setSearchLeft(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {filteredAvailable.length > 0 ? (
                            filteredAvailable.map(student => (
                                <StudentItem
                                    key={student.id}
                                    student={student}
                                    isSelected={false}
                                    onClick={(id) => handleItemClick(id, false)}
                                />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                <Search className="h-8 w-8 mb-2 opacity-20" />
                                <p>Tidak ada siswa ditemukan</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected List (Right) */}
                <div className="flex flex-col h-full bg-blue-50 rounded-xl border border-blue-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <div className="p-4 border-b border-blue-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-blue-900">Akan Diproses ({selectedStudentsList.length})</h3>
                            <button onClick={handleMoveAllLeft} className="text-xs font-medium text-red-500 hover:text-red-700">
                                Batalkan Semua
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari siswa terpilih..."
                                className="pl-9 h-9 bg-white border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                                value={searchRight}
                                onChange={(e) => setSearchRight(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-blue-50/50">
                        {filteredSelected.length > 0 ? (
                            filteredSelected.map(student => (
                                <StudentItem
                                    key={student.id}
                                    student={student}
                                    isSelected={true}
                                    onClick={(id) => handleItemClick(id, true)}
                                />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-blue-300 text-sm">
                                <CheckSquare className="h-8 w-8 mb-2 opacity-50" />
                                <p>Belum ada siswa dipilih</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepStudentSelection;
