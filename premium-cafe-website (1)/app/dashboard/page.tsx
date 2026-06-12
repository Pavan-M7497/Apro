"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useAuth } from '@/components/auth-context'
import { getUserReservations, type Reservation, formatTimeSlot } from '@/lib/reservations'
import { LocationSelector } from '@/components/location-selector'
import { ScrollReveal } from '@/components/ui/scroll-reveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User, 
  CalendarCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Award,
  Clock,
  Users,
  Edit2,
  Save,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-medium text-coffee">{reservation.locationName}</h4>
          <p className="text-sm text-mocha">
            {format(new Date(reservation.date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[reservation.status]}`}>
          {reservation.status}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-mocha">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{formatTimeSlot(reservation.time)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{reservation.guests} guests</span>
        </div>
      </div>
      
      {reservation.occasion && (
        <p className="mt-3 text-sm text-mocha">
          <span className="text-espresso font-medium">Occasion:</span> {reservation.occasion}
        </p>
      )}
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, updateUserProfile } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    phone: '',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
      })
    }
  }, [userProfile])

  useEffect(() => {
    async function fetchReservations() {
      if (user) {
        try {
          const data = await getUserReservations(user.uid)
          setReservations(data)
        } catch (error) {
          console.error('Error fetching reservations:', error)
        } finally {
          setLoadingReservations(false)
        }
      }
    }
    fetchReservations()
  }, [user])

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(editForm)
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  const upcomingReservations = reservations.filter(
    r => new Date(r.date) >= new Date() && (r.status === 'pending' || r.status === 'confirmed')
  )
  const pastReservations = reservations.filter(
    r => new Date(r.date) < new Date() || r.status === 'completed' || r.status === 'cancelled'
  )

  return (
    <>
      <LocationSelector />
      
      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-oat-milk">
        <div className="max-w-7xl mx-auto px-6">
          <ScrollReveal>
            <h1 className="font-serif text-4xl md:text-5xl text-coffee mb-2">
              Welcome back, {userProfile.displayName?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-mocha">Manage your reservations and profile</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-12 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <ScrollReveal>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-xl text-coffee">Profile</h3>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="p-2 text-mocha hover:text-coffee"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="p-2 text-green-600 hover:text-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-mocha hover:text-coffee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-caramel/20 flex items-center justify-center">
                      <User className="w-8 h-8 text-caramel" />
                    </div>
                    <div>
                      {isEditing ? (
                        <Input
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                          className="font-medium text-coffee mb-1"
                          placeholder="Your name"
                        />
                      ) : (
                        <p className="font-medium text-coffee">{userProfile.displayName}</p>
                      )}
                      <p className="text-sm text-mocha">{userProfile.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-mocha" />
                      <span className="text-mocha">{userProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-mocha" />
                      {isEditing ? (
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="text-mocha">{userProfile.phone || 'Not set'}</span>
                      )}
                    </div>
                    {userProfile.favoriteLocation && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-mocha" />
                        <span className="text-mocha">Favorite: {userProfile.favoriteLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Loyalty Points */}
                  <div className="mt-6 pt-6 border-t border-foam">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-caramel" />
                        <span className="font-medium text-coffee">Loyalty Points</span>
                      </div>
                      <span className="text-2xl font-serif text-caramel">
                        {userProfile.loyaltyPoints}
                      </span>
                    </div>
                    <p className="text-xs text-mocha mt-2">
                      Earn 10 points for every visit. 100 points = Free coffee!
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Reservations */}
            <div className="lg:col-span-2">
              <ScrollReveal delay={0.1}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-xl text-coffee flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5" />
                    My Reservations
                  </h3>
                </div>

                {loadingReservations ? (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : reservations.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center">
                    <CalendarCheck className="w-12 h-12 text-foam mx-auto mb-4" />
                    <h4 className="font-serif text-xl text-coffee mb-2">No Reservations Yet</h4>
                    <p className="text-mocha mb-6">You haven't made any reservations yet.</p>
                    <Button
                      onClick={() => router.push('/')}
                      className="bg-coffee hover:bg-espresso text-cream"
                    >
                      Make a Reservation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Upcoming */}
                    {upcomingReservations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-mocha mb-3">Upcoming</h4>
                        <div className="space-y-3">
                          {upcomingReservations.map((r) => (
                            <ReservationCard key={r.id} reservation={r} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past */}
                    {pastReservations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-mocha mb-3">Past</h4>
                        <div className="space-y-3">
                          {pastReservations.slice(0, 5).map((r) => (
                            <ReservationCard key={r.id} reservation={r} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
