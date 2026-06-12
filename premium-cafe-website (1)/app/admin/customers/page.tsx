"use client"

import { useEffect, useState } from 'react'
import { listUsersForAdmin, setUserRole } from '@/lib/cms-service'
import { useAuth } from '@/components/auth-context'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function AdminCustomersPage() {
  const { isAdmin } = useAuth()
  const [rows, setRows] = useState<
    { uid: string; email?: string; displayName?: string; role?: string; loyaltyPoints?: number }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await listUsersForAdmin()
        setRows(data)
      } catch {
        toast.error('Could not load customers')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const changeRole = async (uid: string, role: 'customer' | 'manager' | 'admin') => {
    try {
      await setUserRole(uid, role)
      setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, role } : r)))
      toast.success('Role updated')
    } catch {
      toast.error('Only admins can change roles')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-coffee">Customers</h1>
        <p className="text-mocha mt-1">View loyalty balances and manage roles (admin only).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y divide-foam">
        {rows.map((r) => (
          <div key={r.uid} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-medium text-coffee">{r.displayName || 'Unnamed'}</p>
              <p className="text-sm text-mocha">{r.email}</p>
              <p className="text-xs text-mocha mt-1">UID: {r.uid}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-mocha">Points: {r.loyaltyPoints ?? 0}</span>
              <span className="text-xs uppercase tracking-wide text-mocha">Role: {r.role || 'customer'}</span>
              {isAdmin && (
                <select
                  className="border border-foam rounded-lg px-2 py-1 text-sm bg-oat-milk"
                  value={(r.role as 'customer' | 'manager' | 'admin') || 'customer'}
                  onChange={(e) => changeRole(r.uid, e.target.value as 'customer' | 'manager' | 'admin')}
                >
                  <option value="customer">customer</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <p className="text-sm text-mocha">Managers can view this list; only admins can change roles.</p>
      )}
    </div>
  )
}
