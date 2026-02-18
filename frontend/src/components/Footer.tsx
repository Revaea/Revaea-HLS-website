import Link from 'next/link'
import { Globe, Home } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full text-sm text-slate-600 dark:text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-center sm:text-left">
            <div>© {new Date().getFullYear()} Revaea.</div>
            <div className="text-xs opacity-80">
              All rights reserved for site design and code.
            </div>
            <div className="text-xs opacity-80">Content belongs to respective owners.</div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Home Page
            </Link>
            <a
              href="https://revaea.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              Main Site
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
