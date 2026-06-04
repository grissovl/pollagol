'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export default function GroupSearchForm() {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (trimmed) {
      router.push(`/grupos/buscar?code=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="mt-auto flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Ingrese Código"
        className="border-white/30 bg-white/20 text-white placeholder:text-red-200 focus:ring-white"
      />
      <Button
        type="submit"
        variant="white"
        size="icon"
        className="shrink-0"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4 text-red-600" />
      </Button>
    </form>
  )
}
