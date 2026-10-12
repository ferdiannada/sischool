import { useQuery } from '@tanstack/react-query';
import { scheduleService } from '@/features/schedule/api/scheduleService';
import { supabase } from '../../../lib/supabase';

export const useGuruSchedule = (userId) => {
    return useQuery({
        queryKey: ['schedule', 'guru', userId],
        queryFn: async () => {
            if (!userId) return null;

            // First get the Guru ID from the user ID
            const { data: guruData, error: guruError } = await supabase
                .from('guru')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (guruError) throw guruError;

            // Then fetch the schedule
            const schedules = await scheduleService.getTeacherSchedule(guruData.id);

            // Process/Group data
            const grouped = {
                'Senin': [], 'Selasa': [], 'Rabu': [], 'Kamis': [], 'Jumat': [], 'Sabtu': []
            };

            const dayMap = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu' };

            if (schedules) {
                schedules.forEach(item => {
                    const dayName = dayMap[item.hari];
                    if (dayName && grouped[dayName]) {
                        const timeStr = `${item.jam_mulai?.substring(0, 5)} - ${item.jam_selesai?.substring(0, 5)}`;
                        grouped[dayName].push({
                            id: item.id,
                            subject: item.mata_pelajaran?.nama || 'Mata Pelajaran',
                            class: item.kelas?.nama || 'Kelas',
                            time: timeStr,
                            room: item.ruangan || '-',
                            // Preserve original data if needed
                            hari: item.hari,
                            jam_mulai: item.jam_mulai,
                            jam_selesai: item.jam_selesai
                        });
                    }
                });
            }

            return grouped;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};
