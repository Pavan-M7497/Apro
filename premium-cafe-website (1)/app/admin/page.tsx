"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { getAllReservations, type Reservation } from '@/lib/reservations'
import { 
  CalendarCheck, 
  Users, 
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react'

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  color: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-mocha">{title}</p>
          <p className="text-3xl font-serif text-coffee mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllReservations()
        setReservations(data)
      } catch (error) {
        console.error('Error fetching reservations:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayReservations = reservations.filter(r => r.date === today)
  const pendingReservations = reservations.filter(r => r.status === 'pending')
  const totalGuests = todayReservations.reduce((sum, r) => sum + r.guests, 0)

  const recentReservations = reservations.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-coffee">Admin Dashboard</h1>
        <p className="text-mocha mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Reservations"
          value={todayReservations.length}
          icon={CalendarCheck}
          color="bg-caramel"
        />
        <StatCard
          title="Pending Approval"
          value={pendingReservations.length}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          title="Expected Guests Today"
          value={totalGuests}
          icon={Users}
          color="bg-green-500"
        />
        <StatCard
          title="Total Reservations"
          value={reservations.length}
          icon={TrendingUp}
          color="bg-blue-500"
        />
      </div>

      {/* Recent Reservations */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-foam">
          <h2 className="font-serif text-xl text-coffee">Recent Reservations</h2>
        </div>
        
        {recentReservations.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck className="w-12 h-12 text-foam mx-auto mb-4" />
            <p className="text-mocha">No reservations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-foam">
            {recentReservations.map((reservation) => (
              <div key={reservation.id} className="p-4 hover:bg-oat-milk/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-caramel/20 flex items-center justify-center">
                      <span className="text-caramel font-medium">
                        {reservation.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-coffee">{reservation.userName}</p>
                      <div className="flex items-center gap-3 text-sm text-mocha">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {reservation.locationName}
                        </span>
                        <span>{format(new Date(reservation.date), 'MMM d')} at {reservation.time}</span>
                        <span>{reservation.guests} guests</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    reservation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {reservation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
