import { useCallback, useEffect, useRef } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { trackScreenMetric } from "../lib/performanceMonitor"

function now() {
  if (globalThis.performance?.now) {
    return globalThis.performance.now()
  }

  return Date.now()
}

export function useScreenPerformance(screenName, context = {}) {
  const mountStartedAtRef = useRef(now())
  const focusStartedAtRef = useRef(0)
  const contextRef = useRef(context)

  useEffect(() => {
    contextRef.current = context
  }, [context])

  useEffect(() => {
    const mountStartedAt = mountStartedAtRef.current
    const mountDurationMs = now() - mountStartedAt

    trackScreenMetric(screenName, {
      event: "screen-mounted",
      durationMs: mountDurationMs,
      context: contextRef.current,
    })

    return () => {
      trackScreenMetric(screenName, {
        event: "screen-unmounted",
        durationMs: now() - mountStartedAt,
        context: contextRef.current,
      })
    }
  }, [screenName])

  useFocusEffect(
    useCallback(() => {
      focusStartedAtRef.current = now()

      return () => {
        trackScreenMetric(screenName, {
          event: "screen-focused-session",
          durationMs: now() - focusStartedAtRef.current,
          context: contextRef.current,
        })
      }
    }, [screenName]),
  )
}
