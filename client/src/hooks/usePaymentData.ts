import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService from '@/api/apiService'

export interface PaymentData {
  eventTitle: string
  ticketPrice: number
  platformFee: number
  total: number
  walletBalance: number
  loading: boolean
  error: string | null
}

/** The price comes from the server's quote (early bird, or the code you applied). */
export function usePaymentData(eventId: string | undefined, promoCode?: string | null): PaymentData {
  const [eventTitle, setEventTitle]     = useState('')
  const [ticketPrice, setTicketPrice]   = useState(0)
  const [platformFee, setPlatformFee]   = useState(0)
  const [total, setTotal]               = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useFocusEffect(useCallback(() => {
    if (!eventId) return
    setLoading(true)
    setError(null)
    Promise.all([ApiService.getEvent(eventId), ApiService.getWallet(), ApiService.getQuote(eventId, promoCode)])
      .then(([ev, wallet, q]) => {
        setEventTitle(ev.title)
        setTicketPrice(q.price_inr)
        setPlatformFee(q.fee_inr)
        setTotal(q.total_inr)
        setWalletBalance(wallet.balance)
      })
      .catch(() => setError("Couldn't load payment details"))
      .finally(() => setLoading(false))
  }, [eventId, promoCode]))

  return { eventTitle, ticketPrice, platformFee, total, walletBalance, loading, error }
}
