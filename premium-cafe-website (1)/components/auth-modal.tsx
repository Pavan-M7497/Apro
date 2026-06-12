"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth-context'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'forgot') {
        await resetPassword(email)
        onClose()
        resetForm()
      } else if (mode === 'signin') {
        await signIn(email, password)
        onClose()
        resetForm()
      } else {
        await signUp(email, password, name)
        onClose()
        resetForm()
      }
    } catch {
      // Errors surfaced via toast in auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      onClose()
      resetForm()
    } catch {
      // handled in context
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setShowPassword(false)
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    resetForm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-coffee/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-cream rounded-2xl shadow-2xl overflow-hidden">
              <div className="relative bg-coffee text-cream p-8 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 p-2 rounded-full hover:bg-cream/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-serif text-3xl mb-2">
                  {mode === 'signin' && 'Welcome Back'}
                  {mode === 'signup' && 'Join Us'}
                  {mode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-cream/70 text-sm">
                  {mode === 'signin' &&
                    'Sign in for reservations, rewards & saved favourites across Bengaluru.'}
                  {mode === 'signup' && 'Create an account to earn loyalty points on every visit.'}
                  {mode === 'forgot' && 'We will email you a secure link to reset your password.'}
                </p>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha" />
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-11 h-12 bg-oat-milk border-foam focus:border-caramel focus:ring-caramel"
                        required
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha" />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 bg-oat-milk border-foam focus:border-caramel focus:ring-caramel"
                      required
                    />
                  </div>

                  {mode !== 'forgot' && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mocha" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 bg-oat-milk border-foam focus:border-caramel focus:ring-caramel"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha hover:text-coffee"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  )}

                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot')
                        setPassword('')
                      }}
                      className="text-sm text-coffee hover:text-caramel font-medium"
                    >
                      Forgot password?
                    </button>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-coffee hover:bg-espresso text-cream font-medium"
                  >
                    {isLoading
                      ? 'Please wait...'
                      : mode === 'forgot'
                        ? 'Send reset link'
                        : mode === 'signin'
                          ? 'Sign In'
                          : 'Create Account'}
                  </Button>
                </form>

                {mode !== 'forgot' && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-foam" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-cream text-mocha">or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full h-12 border-foam hover:bg-oat-milk"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                  </>
                )}

                <p className="mt-6 text-center text-sm text-mocha">
                  {mode === 'forgot' ? (
                    <>
                      Remembered your password?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin')
                          resetForm()
                        }}
                        className="text-coffee font-medium hover:text-caramel transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="text-coffee font-medium hover:text-caramel transition-colors"
                      >
                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
