import * as React from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from './ui/button'

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Check localStorage or system preference on mount
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    } else if (saved === 'light') {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={className}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400 transition-transform" />
      ) : (
        <Moon className="size-4 text-neutral-700 transition-transform" />
      )}
    </Button>
  )
}
