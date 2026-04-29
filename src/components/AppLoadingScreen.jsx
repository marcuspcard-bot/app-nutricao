import { useEffect, useState } from "react"
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors, radius, shadow, spacing, typography } from "../mobile/theme"

const logoAsset = require("../../assets/icon-v2.png")

function AppLoadingScreen({
  title = "Preparando sua experiência",
  description = "Carregando sua conta, seus dados e os conteúdos iniciais.",
}) {
  const [pulse] = useState(() => new Animated.Value(0))

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()

    return () => {
      animation.stop()
    }
  }, [pulse])

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  })

  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  })

  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  })

  return (
    <LinearGradient colors={["#f4ede2", "#fffaf3", "#e7f2ea"]} style={styles.shell}>
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[
              styles.halo,
              {
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          <Animated.View style={[styles.logoCard, { transform: [{ scale: logoScale }] }]}>
            <Image source={logoAsset} style={styles.logo} resizeMode="contain" />
          </Animated.View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.dotRow}>
          <Animated.View style={[styles.dot, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]} />
          <Animated.View style={[styles.dot, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0.35] }) }]} />
          <Animated.View style={[styles.dot, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] }) }]} />
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255, 253, 250, 0.9)",
    ...shadow.card,
  },
  logoWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  halo: {
    position: "absolute",
    width: 126,
    height: 126,
    borderRadius: radius.round,
    backgroundColor: colors.brandSoft,
  },
  logoCard: {
    width: 108,
    height: 108,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    ...shadow.card,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  copy: {
    gap: spacing.xs,
    alignItems: "center",
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: "center",
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.brand,
  },
})

export default AppLoadingScreen
