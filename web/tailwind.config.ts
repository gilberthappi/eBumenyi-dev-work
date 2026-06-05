
import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Custom color palette
				primary: {
					DEFAULT: '#3363AD',
					70: 'rgba(51, 99, 173, 0.7)',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#595F74',
					foreground: '#FFFFFF'
				},
				dark: '#373449',
				neutral: {
					DEFAULT: '#69695D',
					60: 'rgba(105, 105, 93, 0.6)'
				},
				'page-bg': 'var(--page-bg)',
				'card-bg': 'var(--card-bg)',
				'card-text': 'var(--card-text)',
				'card-subtitle': 'var(--card-subtitle)',
				'card-shadow': 'var(--card-shadow)',
				// Standard Tailwind-compatible colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: '#3363AD',
				background: '#EFF1F8',
				foreground: '#111827',
				destructive: {
					DEFAULT: 'hsl(0 84.2% 60.2%)',
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: '#EFF1F8',
					foreground: '#595F74'
				},
				accent: {
					DEFAULT: '#595F74',
					foreground: '#FFFFFF'
				},
				popover: {
					DEFAULT: '#FFFFFF',
					foreground: '#111827'
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#111827'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				regular: ['Inter-Regular', 'sans-serif'],
				medium: ['Inter-Medium', 'sans-serif'],
				semibold: ['Inter-SemiBold', 'sans-serif'],
				bold: ['Inter-Bold', 'sans-serif']
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #3363AD 0%, #595F74 100%)',
				'gradient-dark': 'linear-gradient(135deg, #373449 0%, #3363AD 100%)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        'slide-in': {
          '0%': {
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.4s ease-out',
			}
		}
	},
	plugins: [animatePlugin],
} satisfies Config;
