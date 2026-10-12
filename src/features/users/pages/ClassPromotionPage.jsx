import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import PromotionWizard from '../components/promotion/PromotionWizard';
import StepSourceSelection from '../components/promotion/StepSourceSelection';
import StepTargetAction from '../components/promotion/StepTargetAction';
import StepStudentSelection from '../components/promotion/StepStudentSelection';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useClassPromotion } from '../hooks/useClassPromotion';

const ClassPromotionPage = () => {
    // 2. Selection State (Managed here to drive the hook)
    const [sourceYearId, setSourceYearId] = useState('');
    const [sourceClassId, setSourceClassId] = useState('');

    const [actionType, setActionType] = useState('promotion'); // promotion, retention, graduation
    const [targetYearId, setTargetYearId] = useState('');
    const [targetClassId, setTargetClassId] = useState('');

    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    // 3. UI State
    const [currentStep, setCurrentStep] = useState(1);

    // 4. Custom Hook
    const {
        academicYears,
        sourceClasses,
        targetClasses,
        students,
        loadingYears,
        loadingSourceClasses,
        loadingTargetClasses,
        promoteStudents,
        isProcessing
    } = useClassPromotion({ sourceYearId, targetYearId, sourceClassId });

    // Initial Load - Set active year
    useEffect(() => {
        if (academicYears.length > 0 && !sourceYearId) {
            const active = academicYears.find(y => y.is_active);
            if (active) setSourceYearId(active.id);
        }
    }, [academicYears, sourceYearId]);

    // Reset students validation when class changes
    useEffect(() => {
        setSelectedStudentIds([]);
    }, [sourceClassId]);

    // Navigation Logic
    const handleNext = () => {
        if (currentStep === 4) {
            handleSubmit();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: // Source
                return sourceYearId && sourceClassId;
            case 2: // Target
                if (actionType === 'graduation') return true;
                return targetYearId && targetClassId;
            case 3: // Students
                return selectedStudentIds.length > 0;
            case 4: // Confirmation
                return true;
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        const confirmMessage = `Apakah Anda yakin ingin memproses ${selectedStudentIds.length} siswa?`;
        if (!window.confirm(confirmMessage)) return;

        try {
            let newStatus = 'aktif';
            let finalTargetClassId = targetClassId;

            if (actionType === 'graduation') {
                newStatus = 'lulus';
                finalTargetClassId = null;
            } else if (actionType === 'retention') {
                newStatus = 'aktif';
                // Retention usually keeps them in the same class OR moves them to a "Retained" class structure?
                // Assuming 'Retention' logic might just be "Staying in the same Grade Level" but maybe different Class Group?
                // For now, adhering to existing logic: it respects whatever targetClassId is selected (if user picks same class manually)
                // However, UI for retention might naturally suggest the same class.
            }

            await promoteStudents({
                studentIds: selectedStudentIds,
                targetClassId: finalTargetClassId,
                status: newStatus
            });

            // Reset Wizard logic
            setCurrentStep(1);
            setSourceClassId('');
            setTargetClassId('');
            setSelectedStudentIds([]);

        } catch (error) {
            // Error handled by hook
        }
    };

    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <StepSourceSelection
                        academicYears={academicYears}
                        sourceClasses={sourceClasses}
                        sourceYearId={sourceYearId}
                        setSourceYearId={setSourceYearId}
                        sourceClassId={sourceClassId}
                        setSourceClassId={setSourceClassId}
                    />
                );
            case 2:
                return (
                    <StepTargetAction
                        actionType={actionType}
                        setActionType={setActionType}
                        targetYearId={targetYearId}
                        setTargetYearId={setTargetYearId}
                        targetClassId={targetClassId}
                        setTargetClassId={setTargetClassId}
                        academicYears={academicYears}
                        targetClasses={targetClasses}
                        targetClassesLoading={loadingTargetClasses}
                    />
                );
            case 3:
                return (
                    <StepStudentSelection
                        students={students}
                        selectedStudentIds={selectedStudentIds}
                        setSelectedStudentIds={setSelectedStudentIds}
                    />
                );
            case 4:
                // Step 4: Summary/Confirmation
                const sourceClass = sourceClasses.find(c => c.id == sourceClassId);
                const targetClass = targetClasses.find(c => c.id == targetClassId);
                const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));

                return (
                    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">Konfirmasi Proses</h2>
                            <p className="text-gray-500">Pastikan data yang anda pilih sudah benar sebelum menyimpan.</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Total Siswa</p>
                                    <p className="text-2xl font-bold text-blue-600">{selectedStudents.length}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Jenis Aksi</p>
                                    <p className="text-lg font-bold capitalize text-gray-900">
                                        {actionType === 'promotion' ? 'Naik Kelas' :
                                            actionType === 'retention' ? 'Tinggal Kelas' : 'Lulus'}
                                    </p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-sm text-gray-500">Perubahan</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                                    <span className="text-gray-500">Dari Kelas</span>
                                    <span className="font-medium">{sourceClass?.nama}</span>
                                </div>
                                <div className="flex justify-center">
                                    <AlertTriangle className="text-orange-400 h-6 w-6" />
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-md bg-blue-50 border border-blue-100">
                                    <span className="text-blue-600">Ke Kelas (Tujuan)</span>
                                    <span className="font-bold text-blue-800">
                                        {actionType === 'graduation' ? 'ALUMNI / LULUS' : targetClass?.nama || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg flex gap-3 border border-yellow-200">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">
                                Perubahan ini akan memindahkan siswa terpilih ke kelas tujuan. Pastikan target tahun ajaran dan kelas sudah benar.
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loadingYears && !sourceYearId) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Kenaikan Kelas</h1>
                <p className="text-gray-500 mt-1">Wizard pemindahan siswa antar kelas/jenjang.</p>
            </div>

            <PromotionWizard
                currentStep={currentStep}
                onNext={handleNext}
                onBack={handleBack}
                canNext={canProceed()}
                isProcessing={isProcessing}
            >
                {renderStepContent()}
            </PromotionWizard>
        </div>
    );
};

export default ClassPromotionPage;
