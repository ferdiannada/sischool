/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#EEF2FF',
                    100: '#E0E7FF',
                    500: '#6366F1',
                    600: '#4F46E5',
                    700: '#4338CA',
                    900: '#312E81',
                },
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444',
                info: '#3B82F6',
                neutral: '#6B7280',
                role: {
                    admin: '#8B5CF6',
                    guru: '#14B8A6',
                    waliKelas: '#F97316',
                    ketuaKelas: '#06B6D4',
                    siswa: '#6366F1',
                    waliMurid: '#EC4899',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                lg: '12px',
                md: '8px',
                sm: '4px',
            }
        },
    },
    plugins: [],
}
