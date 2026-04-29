import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, radius, shadow, spacing, typography } from "./theme"

export function Page({ children, scroll = true, style, contentContainerStyle, scrollProps }) {
  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.pageContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.pageContent, contentContainerStyle]}>{children}</View>
  )

  return (
    <SafeAreaView style={[styles.page, style]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function SurfaceBox({ children, style, tone = "muted", compact = false }) {
  const toneStyle =
    tone === "soft"
      ? styles.surfaceBoxSoft
      : tone === "default"
        ? styles.surfaceBoxDefault
        : styles.surfaceBoxMuted

  return (
    <View style={[styles.surfaceBox, compact ? styles.surfaceBoxCompact : styles.surfaceBoxRegular, toneStyle, style]}>
      {children}
    </View>
  )
}

export function SurfacePressable({ children, onPress, style, tone = "muted", compact = false, disabled = false }) {
  const toneStyle =
    tone === "soft"
      ? styles.surfaceBoxSoft
      : tone === "default"
        ? styles.surfaceBoxDefault
        : styles.surfaceBoxMuted

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.surfaceBox,
        compact ? styles.surfaceBoxCompact : styles.surfaceBoxRegular,
        toneStyle,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}

export function Button({ label, onPress, variant = "primary", disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{label}</Text>
    </Pressable>
  )
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "sentences",
  multiline = false,
  numberOfLines,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  )
}

export function OptionCard({ title, description, onPress, active = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        active && styles.optionCardActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </Pressable>
  )
}

export function Chip({ label, active = false, onPress, tone = "neutral" }) {
  const chipStyle = active ? styles.chipActive : tone === "warning" ? styles.chipWarning : styles.chip

  if (!onPress) {
    return (
      <View style={chipStyle}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </View>
    )
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [chipStyle, pressed && styles.buttonPressed]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

export function StatusCard({ eyebrow, title, description, tone = "neutral" }) {
  const styleByTone =
    tone === "warning"
      ? styles.statusWarning
      : tone === "success"
        ? styles.statusSuccess
        : styles.statusNeutral

  return (
    <Card style={styleByTone}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.statusTitle}>{title}</Text>
      {description ? <Text style={styles.statusDescription}>{description}</Text> : null}
    </Card>
  )
}

export function EmptyStateCard({ title, description, actionLabel, onAction }) {
  return (
    <Card style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>+</Text>
      </View>
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={styles.statusDescription}>{description}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </Card>
  )
}

export function SectionHeader({ title, helper, trailing }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {helper ? <Text style={styles.sectionHelper}>{helper}</Text> : null}
      </View>
      {trailing ? <Text style={styles.sectionTrailing}>{trailing}</Text> : null}
    </View>
  )
}

export function MetricTile({ label, value }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

export function ProgressBar({ value = 0, tone = "brand" }) {
  const width = `${Math.max(0, Math.min(100, value))}%`
  const barStyle =
    tone === "protein" ? styles.progressProtein : tone === "fat" ? styles.progressFat : tone === "carbs" ? styles.progressCarbs : styles.progressBrand

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressBar, barStyle, { width }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  surfaceBox: {
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  surfaceBoxRegular: {
    padding: spacing.md,
  },
  surfaceBoxCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  surfaceBoxMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  surfaceBoxSoft: {
    backgroundColor: colors.brandSoft,
  },
  surfaceBoxDefault: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  button_primary: {
    backgroundColor: colors.brand,
  },
  button_secondary: {
    backgroundColor: colors.surfaceMuted,
  },
  button_ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    ...typography.bodyStrong,
  },
  buttonText_primary: {
    color: colors.surface,
  },
  buttonText_secondary: {
    color: colors.text,
  },
  buttonText_ghost: {
    color: colors.text,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    color: colors.text,
    ...typography.body,
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  optionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.surface,
  },
  optionCardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  optionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  optionDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  chip: {
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipWarning: {
    borderRadius: radius.round,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipActive: {
    borderRadius: radius.round,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.surface,
  },
  statusNeutral: {
    backgroundColor: colors.surface,
  },
  statusWarning: {
    backgroundColor: colors.warningSoft,
  },
  statusSuccess: {
    backgroundColor: colors.successSoft,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.brand,
    textTransform: "uppercase",
  },
  statusTitle: {
    ...typography.h3,
    color: colors.text,
  },
  statusDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: "flex-start",
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSoft,
  },
  emptyIconText: {
    ...typography.h3,
    color: colors.brand,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionHelper: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  sectionTrailing: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metricTile: {
    flex: 1,
    minWidth: 100,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  metricValue: {
    ...typography.h3,
    color: colors.text,
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: radius.round,
  },
  progressBrand: {
    backgroundColor: colors.brand,
  },
  progressCarbs: {
    backgroundColor: "#d08d3c",
  },
  progressProtein: {
    backgroundColor: "#3474a8",
  },
  progressFat: {
    backgroundColor: "#8b5fbf",
  },
})
