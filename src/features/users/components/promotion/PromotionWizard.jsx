import React, { useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2, Save } from 'lucide-react';

const steps = [
    { id: 1, title: 'Kelas Asal', description: 'Pilih sumber data' },
    { id: 2, title: 'Aksi & Tujuan', description: 'Tentukan proses' },
    { id: 3, title: 'Pilih Siswa', description: 'Seleksi siswa' },
    { id: 4, title: 'Konfirmasi', description: 'Review & Simpan' },
];

const PromotionWizard = ({
    currentStep,
    onNext,
    onBack,
    canNext,
    isProcessing,
    children
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">
            {/* Stepper Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-6">
                <div className="flex items-center justify-between max-w-4xl mx-auto relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 transform -translate-y-1/2 hidden md:block" />

                    {/* Progress Bar Active */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-blue-600 -z-0 transform -translate-y-1/2 transition-all duration-500 hidden md:block"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    />

                    {steps.map((step) => {
                        const isCompleted = step.id < currentStep;
                        const isCurrent = step.id === currentStep;

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-sm
                                    ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                                            isCurrent ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50' :
                                                'bg-white border-gray-300 text-gray-400'}`}
                                >
                                    {isCompleted ? <CheckCircle className="h-6 w-6" /> : step.id}
                                </div>
                                <div className="mt-2 text-center w-32 hidden md:block">
                                    <p className={`text-sm font-semibold ${isCurrent ? 'text-blue-900' : 'text-gray-500'}`}>{step.title}</p>
                                    <p className="text-xs text-gray-400">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 md:p-8 bg-white">
                {children}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    disabled={currentStep === 1 || isProcessing}
                    className="text-gray-500 hover:text-gray-900"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>

                <div className="flex items-center gap-4">
                    {currentStep < steps.length ? (
                        <Button
                            onClick={onNext}
                            disabled={!canNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                        >
                            Lanjut <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={onNext} // Final submit
                            isLoading={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[140px] shadow-lg shadow-green-200"
                        >
                            {isProcessing ? 'Memproses...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromotionWizard;
