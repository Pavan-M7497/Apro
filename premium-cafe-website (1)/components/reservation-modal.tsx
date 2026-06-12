"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Users, MapPin, Gift, MessageSquare, Mail, User } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useAuth } from '@/components/auth-context'
import { useLocation } from '@/components/location-context'
import { createReservation, getAvailableTimeSlots, formatTimeSlot } from '@/lib/reservations'
import { locations } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  /** Optional: parent can open sign-in (e.g. save details to account) */
  onAuthRequired: () => void
}

const occasions = [
  'Birthday',
  'Anniversary',
  'Date Night',
  'Business Meeting',
  'Family Gathering',
  'Friends Meetup',
  'Other',
]

export function ReservationModal({ isOpen, onClose, onAuthRequired }: ReservationModalProps) {
  const { user, userProfile } = useAuth()
  const { selectedLocation } = useLocation()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [locationId, setLocationId] = useState(selectedLocation?.id || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState(2)
  const [occasion, setOccasion] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [phone, setPhone] = useState(userProfile?.phone || '')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')

  const timeSlots = date ? getAvailableTimeSlots(date) : []
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const handleSubmit = async () => {
    if (!locationId || !date || !time || !phone) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!user) {
      if (!guestName.trim() || !guestEmail.trim()) {
        toast.error('Please enter your name and email')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const location = locations.find((l) => l.id === locationId)
      const userName = userProfile?.displayName || guestName.trim()
      const userEmail = user?.email || guestEmail.trim()

      await createReservation({
        userId: user?.uid ?? null,
        userEmail,
        userName,
        userPhone: phone,
        locationId,
        locationName: location?.name || '',
        date,
        time,
        guests,
        occasion: occasion || undefined,
        specialRequests: specialRequests || undefined,
        isGuest: !user,
      })

      toast.success('Reservation request submitted! Our team will confirm shortly.')
      onClose()
      resetForm()
    } catch {
      toast.error('Failed to create reservation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setLocationId(selectedLocation?.id || '')
    setDate('')
    setTime('')
    setGuests(2)
    setOccasion('')
    setSpecialRequests('')
    setPhone(userProfile?.phone || '')
    setGuestName('')
    setGuestEmail('')
  }

  const canProceedStep1 = locationId && date && time
  const guestDetailsOk =
    Boolean(phone) &&
    (user ? true : guestName.trim().length > 1 && guestEmail.includes('@'))
  const canProceedStep2 = guests > 0 && guestDetailsOk

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-cream rounded-2xl shadow-2xl overflow-hidden">
              <div className="relative bg-coffee text-cream p-6 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 p-2 rounded-full hover:bg-cream/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-serif text-2xl mb-1">Reserve a Table</h2>
                <p className="text-cream/70 text-sm">
                  {step === 1 ? 'Select your preferred time' : step === 2 ? 'Your details' : 'Review your booking'}
                </p>

                <div className="flex justify-center gap-2 mt-4">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        s === step ? 'bg-caramel' : s < step ? 'bg-cream' : 'bg-cream/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </label>
                        <select
                          value={locationId}
                          onChange={(e) => setLocationId(e.target.value)}
                          className="w-full h-12 px-4 bg-oat-milk border border-foam rounded-lg focus:border-caramel focus:ring-1 focus:ring-caramel outline-none"
                        >
                          <option value="">Select a location</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </label>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => {
                            setDate(e.target.value)
                            setTime('')
                          }}
                          min={minDate}
                          max={maxDate}
                          className="h-12 bg-oat-milk border-foam focus:border-caramel focus:ring-caramel"
                        />
                      </div>

                      {date && (
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                            <Clock className="w-4 h-4" />
                            Time
                          </label>
                          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setTime(slot)}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                  time === slot
                                    ? 'bg-coffee text-cream'
                                    : 'bg-oat-milk text-coffee hover:bg-foam'
                                }`}
                              >
                                {formatTimeSlot(slot)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!canProceedStep1}
                        className="w-full h-12 bg-coffee hover:bg-espresso text-cream mt-4"
                      >
                        Continue
                      </Button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                          <Users className="w-4 h-4" />
                          Number of Guests
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            className="w-10 h-10 rounded-full bg-oat-milk text-coffee hover:bg-foam flex items-center justify-center text-xl font-medium"
                          >
                            -
                          </button>
                          <span className="text-2xl font-serif text-coffee w-12 text-center">{guests}</span>
                          <button
                            type="button"
                            onClick={() => setGuests(Math.min(20, guests + 1))}
                            className="w-10 h-10 rounded-full bg-oat-milk text-coffee hover:bg-foam flex items-center justify-center text-xl font-medium"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {!user && (
                        <>
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                              <User className="w-4 h-4" />
                              Full Name
                            </label>
                            <Input
                              type="text"
                              placeholder="Your name"
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              className="h-12 bg-oat-milk border-foam focus:border-caramel focus:ring-caramel"
                              required
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </label>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              className="h-12 bg-oat-milk border-foam focus:border-caramel focus:ring-caramel"
                              required
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-sm font-medium text-coffee mb-2 block">Phone Number</label>
                        <Input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 bg-oat-milk border-foam focus:border-caramel focus:ring-caramel"
                          required
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                          <Gift className="w-4 h-4" />
                          Occasion (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {occasions.map((occ) => (
                            <button
                              key={occ}
                              type="button"
                              onClick={() => setOccasion(occasion === occ ? '' : occ)}
                              className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                                occasion === occ
                                  ? 'bg-caramel text-coffee'
                                  : 'bg-oat-milk text-coffee hover:bg-foam'
                              }`}
                            >
                              {occ}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-coffee mb-2">
                          <MessageSquare className="w-4 h-4" />
                          Special Requests (Optional)
                        </label>
                        <Textarea
                          placeholder="Dietary needs, high chair, outdoor seating…"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          className="bg-oat-milk border-foam focus:border-caramel focus:ring-caramel min-h-[80px]"
                        />
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1 h-12 border-foam hover:bg-oat-milk"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setStep(3)}
                          disabled={!canProceedStep2}
                          className="flex-1 h-12 bg-coffee hover:bg-espresso text-cream"
                        >
                          Review
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="bg-oat-milk rounded-xl p-4 space-y-3">
                        <div className="flex justify-between gap-2">
                          <span className="text-mocha">Location</span>
                          <span className="font-medium text-coffee text-right">
                            {locations.find((l) => l.id === locationId)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mocha">Date</span>
                          <span className="font-medium text-coffee">
                            {date && format(new Date(date), 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mocha">Time</span>
                          <span className="font-medium text-coffee">{time && formatTimeSlot(time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-mocha">Guests</span>
                          <span className="font-medium text-coffee">{guests} people</span>
                        </div>
                        {occasion && (
                          <div className="flex justify-between">
                            <span className="text-mocha">Occasion</span>
                            <span className="font-medium text-coffee">{occasion}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2">
                          <span className="text-mocha">Contact</span>
                          <span className="font-medium text-coffee text-right break-all">
                            {user ? userProfile?.displayName : guestName} · {user ? user.email : guestEmail} ·{' '}
                            {phone}
                          </span>
                        </div>
                        {specialRequests && (
                          <div className="pt-2 border-t border-foam">
                            <span className="text-mocha text-sm">Special Requests:</span>
                            <p className="text-coffee text-sm mt-1">{specialRequests}</p>
                          </div>
                        )}
                      </div>

                      {!user && (
                        <div className="bg-caramel/20 border border-caramel rounded-xl p-4 text-center">
                          <p className="text-coffee text-sm mb-3">
                            Want offers & faster rebooking? Create a free account anytime.
                          </p>
                          <Button type="button" onClick={onAuthRequired} className="bg-coffee hover:bg-espresso text-cream">
                            Sign In or Create Account
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(2)}
                          className="flex-1 h-12 border-foam hover:bg-oat-milk"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1 h-12 bg-coffee hover:bg-espresso text-cream"
                        >
                          {isSubmitting ? 'Submitting...' : 'Confirm Reservation'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
