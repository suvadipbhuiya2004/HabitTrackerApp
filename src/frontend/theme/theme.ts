// Theme configuration for the HabitTrackerApp

// Color palette
export const colors = {
    // Primary colors
    primary: '#4A6FFF',
    primaryDark: '#3A5AE0',
    primaryLight: '#7A95FF',

    // Secondary colors
    secondary: '#FF6B6B',
    secondaryDark: '#E05555',
    secondaryLight: '#FF9B9B',

    // Neutral colors
    background: '#F8F9FC',
    card: '#FFFFFF',
    inputBackground: '#F5F7FC',
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#999999',

    // Status colors
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#E53935',
    info: '#2196F3',

    // UI elements
    border: '#E0E0E0',
    divider: '#EEEEEE',
    disabled: '#CCCCCC',
    shadow: 'rgba(0, 0, 0, 0.1)',
};

// Typography
export const typography = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        bold: 'System',
    },
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },
    lineHeight: {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 28,
        xl: 32,
        xxl: 36,
        xxxl: 40,
    },
};

// Spacing
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border radius
export const borderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
};

// Shadows
export const shadows = {
    sm: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    md: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3.0,
        elevation: 3,
    },
    lg: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 5.0,
        elevation: 6,
    },
};

// Common component styles
export const components = {
    // Card styles
    card: {
        ...shadows.md,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginVertical: spacing.sm,
    },

    // Button styles
    button: {
        primary: {
            backgroundColor: colors.primary,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        secondary: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.primary,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        danger: {
            backgroundColor: colors.error,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
    },

    // Input styles
    input: {
        backgroundColor: colors.inputBackground,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.fontSize.md,
        color: colors.text,
    },

    // Header styles
    header: {
        backgroundColor: colors.card,
        ...shadows.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
};

// Export the theme
export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    components,
};
