export function formatShortDate(value) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export function getWeeklyWindowLabel(value) {
  const start = new Date(value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  return `${formatShortDate(start)} - ${formatShortDate(end)}`
}

export function normalizeHistory(checkins) {
  return [...checkins]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((item) => ({
      ...item,
      label: getWeeklyWindowLabel(item.date),
    }))
}

export function buildChartPoints(history) {
  if (history.length === 0) return ""

  const weights = history.map((item) => item.peso)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  return history
    .map((item, index) => {
      const x = history.length === 1 ? 140 : index * (280 / (history.length - 1))
      const y = 112 - ((item.peso - min) / range) * 76
      return `${x},${y}`
    })
    .join(" ")
}

export function getChartPointPosition(history, index) {
  const weights = history.map((item) => item.peso)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  return {
    cx: history.length === 1 ? 140 : index * (280 / (history.length - 1)),
    cy: 112 - ((history[index].peso - min) / range) * 76,
  }
}
