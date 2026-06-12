"use client"

import { AuthModal } from '@/components/auth-modal'
import { useAuth } from '@/components/auth-context'

export function AuthModalHost() {
  const { authModalOpen, closeSignIn } = useAuth()
  return <AuthModal isOpen={authModalOpen} onClose={closeSignIn} />
}
