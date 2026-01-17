/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            colors: {
                brand: {
                    900: '#0f172a', // Deep Navy (Sidebar)
                    800: '#1e293b',
                    700: '#334155',
                    600: '#2563eb', // Primary Blue
                    500: '#3b82f6',
                    50: '#eff6ff', // Light Blue background
                },
                success: {
                    DEFAULT: '#10b981',
                    light: '#d1fae5',
                    text: '#065f46',
                },
                danger: {
                    DEFAULT: '#e11d48',
                    light: '#ffe4e6',
                    text: '#9f1239',
                },
                warning: {
                    DEFAULT: '#f59e0b',
                    light: '#fef3c7',
                    text: '#92400e',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    hover: '#f8fafc',
                }
            },
            boxShadow: {
                'soft': '0 10px 40px -10px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px -5px rgba(37, 99, 235, 0.4)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
