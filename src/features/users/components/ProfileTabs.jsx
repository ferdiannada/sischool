import React from 'react';
import {
    Calendar, MapPin, Phone, Mail, Heart, User, Clock,
    Shield, Briefcase, Book, Hash, Award, Star, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import InfoRow from './InfoRow';

/**
 * PersonalInfoTab - Personal information tab content
 */
export const PersonalInfoTab = ({ displayData }) => (
    <>
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Identitas Utama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <InfoRow
                    icon={Calendar}
                    label="Tempat, Tanggal Lahir"
                    value={`${displayData?.tempat_lahir || ''}, ${displayData?.tanggal_lahir
                        ? format(new Date(displayData.tanggal_lahir), 'd MMMM yyyy', { locale: idLocale })
                        : '-'}`}
                />
                <InfoRow icon={Heart} label="Agama" value={displayData?.agama} />
                <InfoRow
                    icon={User}
                    label="Jenis Kelamin"
                    value={displayData?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                />
                <InfoRow
                    icon={Clock}
                    label="Usia"
                    value={displayData?.tanggal_lahir
                        ? `${new Date().getFullYear() - new Date(displayData.tanggal_lahir).getFullYear()} Tahun`
                        : '-'
                    }
                />
            </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500" />
                Kontak & Alamat
            </h3>
            <div className="space-y-6">
                <div className="p-5 bg-gradient-to-r from-orange-50 to-orange-50/20 rounded-2xl border border-orange-100">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm text-orange-600">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">
                                Alamat Domisili
                            </p>
                            <p className="text-gray-900 font-medium leading-relaxed">
                                {displayData?.alamat || 'Belum ada data alamat tercatat'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow icon={Phone} label="No. Telepon" value={displayData?.telepon} copyable highlight />
                    <InfoRow icon={Mail} label="Email" value={displayData?.email} copyable />
                </div>
            </div>
        </div>
    </>
);

/**
 * FamilyInfoTab - Family information tab content
 */
export const FamilyInfoTab = ({ displayData }) => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/60 relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Data Ayah
                </h3>
                <div className="space-y-4 relative z-10">
                    <InfoRow icon={User} label="Nama Lengkap" value={displayData?.nama_ayah} />
                    <InfoRow icon={Briefcase} label="Pekerjaan" value={displayData?.pekerjaan_ayah} />
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/60 relative overflow-hidden group hover:border-pink-200 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Data Ibu
                </h3>
                <div className="space-y-4 relative z-10">
                    <InfoRow icon={User} label="Nama Lengkap" value={displayData?.nama_ibu} />
                    <InfoRow icon={Briefcase} label="Pekerjaan" value={displayData?.pekerjaan_ibu} />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                Kontak Orang Tua / Wali
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow icon={Phone} label="Nomor Telepon Wali" value={displayData?.telepon_ortu} copyable highlight />
                <InfoRow icon={MapPin} label="Alamat Orang Tua" value={displayData?.alamat_ortu || displayData?.alamat} />
            </div>
        </div>
    </>
);

/**
 * AcademicInfoTab - Academic information tab content
 */
export const AcademicInfoTab = ({ displayData }) => (
    <>
        <div className="bg-gradient-to-br from-primary-900 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500 opacity-20 rounded-full -ml-20 -mb-20 blur-2xl"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Kelas Saat Ini</p>
                    <h2 className="text-4xl font-extrabold mb-1">{displayData?.kelas_nama}</h2>
                    <div className="text-indigo-100 flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                        Status Aktif
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-indigo-200">Wali Kelas</p>
                            <p className="font-bold text-white text-sm">{displayData?.wali_kelas_nama || '-'}</p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-green-400 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-right mt-1 text-indigo-200">Semester 2 berjalan</p>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Book className="h-5 w-5 text-purple-500" />
                Detail Akademik
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow icon={Hash} label="Tahun Masuk" value={displayData?.tahun_masuk || '-'} />
                <InfoRow icon={Book} label="Jurusan / Peminatan" value={displayData?.jurusan || 'Umum'} />
                <InfoRow icon={Award} label="Status Beasiswa" value="Tidak ada" />
                <InfoRow icon={Star} label="Peringkat Kelas" value="-" />
            </div>
        </div>
    </>
);
