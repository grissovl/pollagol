import Link from 'next/link'
import { Construction, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CrearGrupoPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Construction className="mb-4 h-16 w-16 text-yellow-400" />
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Próximamente</h1>
      <p className="mb-6 max-w-sm text-gray-500">
        La funcionalidad de crear grupos está en desarrollo. Vuelve pronto.
      </p>
      <Button asChild variant="outline">
        <Link href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </Button>
    </div>
  )
}
