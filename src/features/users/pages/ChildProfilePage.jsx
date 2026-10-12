import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { User, Users, School, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParentData, useChildDetail } from '../hooks/useParentData';

// Extracted Components
import {
    TabButton,
    ProfileCard,
    LoadingSpinner,
    EmptyChildState,
    PersonalInfoTab,
    FamilyInfoTab,
    AcademicInfoTab
} from '../components';

const ChildProfilePage = () => {
    const { user } = useAuthStore();
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');

    // 1. Fetch Children
    const { data: children = [], isLoading: isLoadingChildren } = useParentData(user?.id);

    // 2. Auto-select first child if none selected
    // 2. Auto-select first child if none selected
    useEffect(() => {
        if (children.length > 0 && !selectedChildId) {
            setSelectedChildId(children[0].id);
        }
    }, [children]); // Remove selectedChildId to avoid cycle

    // 3. Fetch Selected Child Detail
    const { data: childDetail, isLoading: isLoadingDetail } = useChildDetail(selectedChildId);

    // Derived: Find selected child object from list
    const selectedChildBasic = children.find(c => c.id === selectedChildId) || children[0];
    const displayData = childDetail || selectedChildBasic;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    // Tab configuration
    const tabs = [
        { id: 'personal', label: 'Data Diri', icon: User },
        { id: 'family', label: 'Keluarga', icon: Users },
        { id: 'academic', label: 'Akademik', icon: School },
    ];

    // Loading state
    if (isLoadingChildren) {
        return <LoadingSpinner />;
    }

    // Empty state
    if (!isLoadingChildren && children.length === 0) {
        return <EmptyChildState />;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Top Navigation Bar / Child Selector */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-indigo-600">
                                Profil Siswa
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">Informasi Akademik & Data Diri</p>
                        </div>

                        {children.length > 0 && (
                            <div className="relative group">
                                <div className="flex items-center gap-3 pl-4 pr-10 py-2.5 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm">
                                        {selectedChildBasic?.full_name?.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Siswa Terpilih</p>
                                        <p className="text-sm font-bold text-gray-900 leading-tight">{selectedChildBasic?.full_name}</p>
                                    </div>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-primary-500 transition-colors" />

                                    <select
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        value={selectedChildId || ''}
                                        onChange={(e) => setSelectedChildId(parseInt(e.target.value))}
                                    >
                                        {children.map(child => (
                                            <option key={child.id} value={child.id}>{child.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Sidebar - Profile Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <ProfileCard displayData={displayData} />
                    </div>

                    {/* Right Content Area */}
                    <div className="lg:col-span-8">
                        {/* Tab Navigation */}
                        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-1.5 flex gap-1 mb-6 overflow-x-auto scrollbar-hide border border-white/60 shadow-sm sticky top-24 z-20">
                            {tabs.map((tab) => (
                                <TabButton
                                    key={tab.id}
                                    id={tab.id}
                                    label={tab.label}
                                    icon={tab.icon}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                />
                            ))}
                        </div>

                        <div className="relative min-h-[400px]">
                            {isLoadingDetail && (
                                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-6"
                                >
                                    {activeTab === 'personal' && <PersonalInfoTab displayData={displayData} />}
                                    {activeTab === 'family' && <FamilyInfoTab displayData={displayData} />}
                                    {activeTab === 'academic' && <AcademicInfoTab displayData={displayData} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChildProfilePage;
