import * as React from 'react'
import { Direction } from 'radix-ui'

export interface DirectionProviderProps {
  dir: 'ltr' | 'rtl'
  children: React.ReactNode
  className?: string
}

/**
 * Shadcn RTL Direction Provider
 * Integrates Radix UI's Direction.Provider to ensure all Shadcn/Radix components
 * (Tooltips, Selects, Menus, Sliders, Sheets, etc.) observe the correct direction.
 * Automatically synchronizes document root dir and lang attributes.
 */
export function DirectionProvider({ dir, children, className = '' }: DirectionProviderProps) {
  React.useEffect(() => {
    const prevDir = document.documentElement.dir || 'ltr'
    const prevLang = document.documentElement.lang || 'en'

    document.documentElement.dir = dir
    document.documentElement.lang = dir === 'rtl' ? 'ar' : 'en'

    return () => {
      document.documentElement.dir = prevDir
      document.documentElement.lang = prevLang
    }
  }, [dir])

  return (
    <Direction.Provider dir={dir}>
      <div
        dir={dir}
        lang={dir === 'rtl' ? 'ar' : 'en'}
        className={`${dir === 'rtl' ? 'font-arabic' : ''} ${className}`}
      >
        {children}
      </div>
    </Direction.Provider>
  )
}
