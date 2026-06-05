// Centralized theme, fonts and assets for the app
export const colors = {
  light: {
    // Gradient using primary and secondary
    backgroundGradient: ['#3363AD', '#595F74'] as const,
    primary: '#3363AD',
    secondary: '#595F74',
    dark: '#373449',
    pageBackground: '#EFF1F8',
    // 70% opacity of primary
    primary70: 'rgba(51,99,173,0.7)',
    neutral: '#69695D',
    // 60% opacity of neutral
    neutral60: 'rgba(105,105,93,0.6)',
    cardBg: '#FFFFFF',
    cardText: '#111827',
    cardSubtitle: '#595F74',
    cardShadow: 'rgba(16,24,40,0.06)'
  },
  dark: {
    // Dark gradient using dark and primary
    backgroundGradient: ['#373449', '#3363AD'] as const,
    primary: '#3363AD',
    secondary: '#595F74',
    dark: '#373449',
    pageBackground: '#1f1146',
    primary70: 'rgba(51,99,173,0.7)',
    neutral: '#69695D',
    neutral60: 'rgba(105,105,93,0.6)',
    cardBg: '#111827',
    cardText: '#f8fafc',
    cardSubtitle: 'rgba(255,255,255,0.75)',
    cardShadow: 'rgba(0,0,0,0.6)'
  }
} as const;

export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold'
};

// Tailwind CSS class mappings for easy reference
export const tailwindClasses = {
  // Primary color utilities
  primary: {
    bg: 'bg-primary',
    text: 'text-primary',
    border: 'border-primary',
    hover: {
      bg: 'hover:bg-primary',
      text: 'hover:text-primary',
      border: 'hover:border-primary',
    },
    opacity70: {
      bg: 'bg-primary-70',
      text: 'text-primary-70',
    }
  },
  // Secondary color utilities
  secondary: {
    bg: 'bg-secondary',
    text: 'text-secondary',
    border: 'border-secondary',
    hover: {
      bg: 'hover:bg-secondary',
      text: 'hover:text-secondary',
      border: 'hover:border-secondary',
    }
  },
  // Dark color utilities
  dark: {
    bg: 'bg-dark',
    text: 'text-dark',
    border: 'border-dark',
  },
  // Neutral color utilities
  neutral: {
    bg: 'bg-neutral',
    text: 'text-neutral',
    border: 'border-neutral',
    opacity60: {
      bg: 'bg-neutral-60',
      text: 'text-neutral-60',
    }
  },
  // Page background
  pageBackground: 'bg-page-bg',
  // Card utilities
  card: {
    bg: 'bg-card-bg',
    text: 'text-card-text',
    subtitle: 'text-card-subtitle',
    shadow: 'shadow-[0_1px_3px_0_var(--card-shadow)]',
  },
  // Gradient backgrounds
  gradients: {
    primary: 'bg-gradient-primary',
    dark: 'bg-gradient-dark',
  },
  // Font families
  fonts: {
    regular: 'font-regular',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }
} as const;
