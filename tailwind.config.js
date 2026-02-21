/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                panel: {
                    900: '#0a0a0a',
                    800: '#111111',
                    700: '#1a1a1a',
                    600: '#222222',
                    500: '#2a2a2a',
                },
                readout: {
                    green: '#39ff14',
                    amber: '#ffbf00',
                    red: '#ff3131',
                    dim: '#1a3a0a',
                },
            },
            boxShadow: {
                'inset-panel': 'inset 0 1px 4px rgba(0,0,0,0.6)',
                glow: '0 0 12px rgba(57, 255, 20, 0.15)',
            },
        },
    },
    plugins: [],
};
