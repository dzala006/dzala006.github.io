import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/theme';

export default StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  question: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: typography.lineHeight.md * 1.2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    marginBottom: spacing.lg,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.neutral.lighter,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
  },
  buttonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  cancelButtonText: {
    color: colors.text.secondary,
  },
  submitButtonText: {
    color: colors.primary.contrast,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  optionContainer: {
    marginBottom: spacing.lg,
  },
  optionButton: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  optionButtonSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + '20', // 20% opacity
  },
  optionText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.medium,
  },
});