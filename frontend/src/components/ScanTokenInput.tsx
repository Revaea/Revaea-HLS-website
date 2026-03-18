"use client"

import { useEffect, useState } from 'react'
import { KeyRound, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { clearScanToken, getScanToken, setScanToken } from '@/lib/api'

export default function ScanTokenInput() {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(getScanToken())
  }, [])

  const save = () => {
    const v = value.trim()
    if (!v) {
      toast.error('Token 不能为空')
      return
    }
    setScanToken(v)
    setValue(v)
    toast.success('Token 已保存')
  }

  const clear = () => {
    clearScanToken()
    setValue('')
    toast.success('Token 已清除')
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70">
      <label htmlFor="scan-token" className="text-sm text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 shrink-0">
        <KeyRound size={14} />
        <span>扫描 Token</span>
      </label>
      <input
        id="scan-token"
        type="password"
        placeholder="输入扫描 Token"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          }
        }}
        className="h-9 flex-1 min-w-0 px-3 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={save}>
          <Save className="mr-1" size={14} /> 保存
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          <Trash2 className="mr-1" size={14} /> 清除
        </Button>
      </div>
    </div>
  )
}
