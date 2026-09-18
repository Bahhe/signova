import * as React from 'react'
import type { StorefrontSettings } from './types'
import { DEFAULT_STOREFRONT_SETTINGS } from './types'
import {
  getStorefrontSettingsServerFn,
  saveStorefrontSettingsServerFn,
} from './server-settings'

const SETTINGS_STORAGE_KEY = 'signova_storefront_settings_cache'

function getInitialFromStorage(): StorefrontSettings {
  if (typeof window === 'undefined') return DEFAULT_STOREFRONT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object') {
        const p = parsed as Partial<StorefrontSettings>
        return {
          ...DEFAULT_STOREFRONT_SETTINGS,
          ...p,
          socialLinks: {
            ...DEFAULT_STOREFRONT_SETTINGS.socialLinks,
            ...p.socialLinks,
          },
        }
      }
    }
  } catch (err) {
    console.error('Failed reading localStorage storefront settings:', err)
  }
  return DEFAULT_STOREFRONT_SETTINGS
}

function saveToStorage(settings: StorefrontSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.warn('Failed saving storefront settings to localStorage:', err)
  }
}

export function useStorefrontSettings(
  initialSettings?: StorefrontSettings | null,
) {
  const [settings, setSettings] = React.useState<StorefrontSettings>(() => {
    if (initialSettings) {
      saveToStorage(initialSettings)
      return initialSettings
    }
    return getInitialFromStorage()
  })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await getStorefrontSettingsServerFn()
      setSettings(data)
      saveToStorage(data)
    } catch (err: any) {
      console.error('Failed fetching storefront settings:', err)
      setError(err?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!initialSettings) {
      void refresh()
    }
  }, [initialSettings, refresh])

  const saveSettings = React.useCallback(
    async (
      updated: Partial<StorefrontSettings>,
    ): Promise<StorefrontSettings> => {
      setLoading(true)
      setError(null)
      try {
        const result = await saveStorefrontSettingsServerFn({ data: updated })
        setSettings(result)
        saveToStorage(result)
        return result
      } catch (err: any) {
        setError(err?.message || 'Failed to save settings')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return {
    settings,
    loading,
    error,
    refresh,
    saveSettings,
  }
}
