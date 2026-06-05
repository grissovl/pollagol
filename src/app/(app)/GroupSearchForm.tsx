'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { joinGroup } from '@/app/actions/groups'

export default function GroupSearchForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await joinGroup(trimmed)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setCode('')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSearch} className="mt-auto space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Ingresa el código"
          disabled={isPending}
          className="border-white/30 bg-white/20 text-white placeholder:text-red-200 focus:ring-white"
        />
        <Button
          type="submit"
          variant="white"
          size="icon"
          className="shrink-0"
          aria-label="Buscar"
          disabled={isPending || !code.trim()}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
          ) : (
            <Search className="h-4 w-4 text-red-600" />
          )}
        </Button>
      </div>
      {error && <p className="text-sm font-medium text-red-200">{error}</p>}
      {success && <p className="text-sm font-medium text-green-200">¡Solicitud enviada! Revisa Mis Grupos.</p>}
    </form>
  )
}
