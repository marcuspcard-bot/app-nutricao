import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { colors, radius, shadow, spacing, typography } from "../mobile/theme"

function EntryShell({
  eyebrow,
  title,
  description,
  footer,
  highlights = [],
  step,
  totalSteps,
  children,
}) {
  const progress = step && totalSteps ? `${step}/${totalSteps}` : null
  const progressWidth = step && totalSteps ? `${Math.min(100, Math.round((step / totalSteps) * 100))}%` : "0%"

  return (
    <LinearGradient colors={["#f7eddc", "#fff8ef", "#e8f5e8"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.hero}>
              {progress ? (
                <View style={styles.progressBlock}>
                  <View style={styles.progressHead}>
                    <Text style={styles.progressLabel}>Etapa atual</Text>
                    <Text style={styles.progressValue}>{progress}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: progressWidth }]} />
                  </View>
                </View>
              ) : null}

              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              {description ? <Text style={styles.description}>{description}</Text> : null}

              {highlights.length ? (
                <View style={styles.highlightGrid}>
                  {highlights.map((item) => (
                    <View key={item.title} style={styles.highlightCard}>
                      <Text style={styles.highlightTitle}>{item.title}</Text>
                      <Text style={styles.highlightDescription}>{item.description}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.children}>{children}</View>
            {footer ? <Text style={styles.footer}>{footer}</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  hero: {
    gap: spacing.sm,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  progressValue: {
    ...typography.caption,
    color: colors.brand,
    fontFamily: typography.semiBold,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#dcead8",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.brand,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
  },
  highlightGrid: {
    gap: spacing.sm,
  },
  highlightCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  highlightTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  highlightDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  children: {
    gap: spacing.md,
  },
  footer: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
  },
})

export default EntryShell
