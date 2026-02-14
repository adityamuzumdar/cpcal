export const readStoredSet = (key: string) => {
  try {
    const value = localStorage.getItem(key)
    if (!value) {
      return new Set<string>()
    }
    const parsed = JSON.parse(value)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch (_error) {
    return new Set<string>()
  }
}

export const readStoredNotes = (key: string) => {
  try {
    const value = localStorage.getItem(key)
    if (!value) {
      return {} as Record<string, string>
    }

    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>
    }

    return {}
  } catch (_error) {
    return {}
  }
}
