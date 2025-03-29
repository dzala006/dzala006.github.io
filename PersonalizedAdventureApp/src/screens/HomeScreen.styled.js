import { StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary.main,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    ...shadows.md,
  },
  greeting: {
    color: colors.primary.contrast,
    marginBottom: spacing.xs,
  },
  userName: {
    color: colors.primary.contrast,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: colors.primary.contrast,
    fontSize: typography.fontSize.md,
    marginLeft: spacing.sm,
  },
  sectionContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
  },
  seeAllText: {
    color: colors.primary.main,
  },
  cardContainer: {
    marginTop: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    ...shadows.sm,
  },
  cardImage: {
    height: 150,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    backgroundColor: colors.neutral.lighter,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  cardDescription: {
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statText: {
    marginLeft: spacing.xs,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    ...shadows.sm,
  },
  quickActionIcon: {
    marginBottom: spacing.xs,
  },
  quickActionText: {
    textAlign: 'center',
  },
  feedbackButton: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
  },
  updateBanner: {
    backgroundColor: colors.accent.light,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  updateBannerText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.accent.dark,
  },
  collaborativeSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  collaborativeCard: {
    backgroundColor: colors.secondary.light + '20', // 20% opacity
    borderWidth: 1,
    borderColor: colors.secondary.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  collaborativeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collaborativeCardText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  collaborativeCardTitle: {
    color: colors.secondary.dark,
    marginBottom: spacing.xs,
  },
  collaborativeCardDescription: {
    color: colors.text.secondary,
  },
});