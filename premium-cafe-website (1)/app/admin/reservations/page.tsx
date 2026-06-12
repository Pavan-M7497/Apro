"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { 
  getAllReservations, 
  updateReservationStatus, 
  type Reservation,
  formatTimeSlot 
} from '@/lib/reservations'
import { locations } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { 
  CalendarCheck, 
  Clock, 
  Users, 
  MapPin, 
  Phone,
  Mail,
  Check,
  X,
  Filter,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  useEffect(() => {
    fetchReservations()
  }, [])

  async function fetchReservations() {
    try {
      const data = await getAllReservations()
      setReservations(data)
    } catch (error) {
      console.error('Error fetching reservations:', error)
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(id: string, status: Reservation['status']) {
    try {
      await updateReservationStatus(id, status)
      setReservations(prev => 
        prev.map(r => r.id === id ? { ...r, status } : r)
      )
      toast.success(`Reservation ${status}`)
      setSelectedReservation(null)
    } catch {
      toast.error('Failed to update reservation')
    }
  }

  const filteredReservations = reservations.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    const matchesLocation = filterLocation === 'all' || r.locationId === filterLocation
    const matchesSearch = searchQuery === '' || 
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userPhone.includes(searchQuery)
    return matchesStatus && matchesLocation && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-caramel border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-coffee">Reservations</h1>
          <p className="text-mocha mt-1">Manage all table reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-mocha">
            {filteredReservations.length} reservations
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-oat-milk border border-foam rounded-lg text-sm focus:border-caramel focus:ring-1 focus:ring-caramel outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-mocha" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2 bg-oat-milk border border-foam rounded-lg text-sm focus:border-caramel outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Location Filter */}
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 bg-oat-milk border border-foam rounded-lg text-sm focus:border-caramel outline-none"
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.shortName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredReservations.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck className="w-12 h-12 text-foam mx-auto mb-4" />
            <p className="text-mocha">No reservations found</p>
          </div>
        ) : (
          <div className="divide-y divide-foam">
            {filteredReservations.map((reservation) => (
              <motion.div
                key={reservation.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-oat-milk/30 transition-colors cursor-pointer"
                onClick={() => setSelectedReservation(reservation)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-caramel/20 flex items-center justify-center">
                      <span className="text-caramel font-semibold text-lg">
                        {reservation.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-coffee">{reservation.userName}</p>
                      <p className="text-sm text-mocha">{reservation.userEmail}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-6 text-sm text-mocha">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {reservation.locationName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4" />
                      {format(new Date(reservation.date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatTimeSlot(reservation.time)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {reservation.guests}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      reservation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {reservation.status}
                    </span>
                    
                    {reservation.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusUpdate(reservation.id!, 'confirmed')
                          }}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusUpdate(reservation.id!, 'cancelled')
                          }}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReservation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-coffee/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedReservation(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
            >
              <div className="bg-cream rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-coffee text-cream p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-2xl">Reservation Details</h3>
                    <button
                      onClick={() => setSelectedReservation(null)}
                      className="p-2 rounded-full hover:bg-cream/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-caramel/20 flex items-center justify-center">
                      <span className="text-caramel font-bold text-xl">
                        {selectedReservation.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-coffee text-lg">{selectedReservation.userName}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        selectedReservation.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        selectedReservation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        selectedReservation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedReservation.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-oat-milk rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-mocha" />
                      <span className="text-coffee">{selectedReservation.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-mocha" />
                      <span className="text-coffee">{selectedReservation.userPhone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-mocha" />
                      <span className="text-coffee">{selectedReservation.locationName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="w-4 h-4 text-mocha" />
                      <span className="text-coffee">
                        {format(new Date(selectedReservation.date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-mocha" />
                      <span className="text-coffee">{formatTimeSlot(selectedReservation.time)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-mocha" />
                      <span className="text-coffee">{selectedReservation.guests} guests</span>
                    </div>
                  </div>

                  {selectedReservation.occasion && (
                    <div>
                      <p className="text-sm text-mocha mb-1">Occasion</p>
                      <p className="text-coffee">{selectedReservation.occasion}</p>
                    </div>
                  )}

                  {selectedReservation.specialRequests && (
                    <div>
                      <p className="text-sm text-mocha mb-1">Special Requests</p>
                      <p className="text-coffee">{selectedReservation.specialRequests}</p>
                    </div>
                  )}

                  {selectedReservation.status === 'pending' && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleStatusUpdate(selectedReservation.id!, 'confirmed')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Confirm
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedReservation.id!, 'cancelled')}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {selectedReservation.status === 'confirmed' && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleStatusUpdate(selectedReservation.id!, 'completed')}
                        className="flex-1 bg-coffee hover:bg-espresso text-cream"
                      >
                        Mark as Completed
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedReservation.id!, 'cancelled')}
                        variant="outline"
                        className="flex-1 border-foam hover:bg-oat-milk"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
