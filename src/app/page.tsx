'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    checkUserAndRedirect()
  }, [])

  const checkUserAndRedirect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Usuário logado - redirecionar para dashboard
        router.push('/dashboard')
      } else {
        // Usuário não logado - redirecionar para auth
        router.push('/auth')
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
      router.push('/auth')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}
