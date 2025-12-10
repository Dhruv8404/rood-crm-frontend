"use client"

import { useApp } from "@/context/app-context"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Spinner from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AuthPage() {
  const { loginCustomer, state, setPendingOrder, clearCart } = useApp()
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  useEffect(() => {
    if (state.pendingOrder && !sent) {
      setPhone(state.user.phone || "")
      setEmail(state.user.email || "")
    }
  }, [state.pendingOrder, state.user, sent])

  const validateInputs = () => {
    if (!phone.trim()) return "Phone number is required"
    if (!email.trim()) return "Email is required"
    if (!/^\d{10}$/.test(phone)) return "Phone number must be 10 digits"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format"
    return null
  }

  const sendOtp = async () => {
    const validationError = validateInputs()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/customer/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email })
      })
      if (res.ok) {
        setSent(true)
        setResendTimer(60) // 60 seconds cooldown
      } else {
        const data = await res.json()
        setError(data.detail || "Failed to send OTP")
      }
    } catch (e) {
      setError("Network error. Please check your connection.")
    }
    setLoading(false)
  }

  const resendOtp = async () => {
    if (resendTimer > 0) return
    await sendOtp()
  }

  const verify = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/customer/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, email })
      })
      if (res.ok) {
        const data = await res.json()
        loginCustomer(phone, email, data.token)

        // Place the pending order after login
        if (state.pendingOrder) {
          const orderRes = await fetch('http://127.0.0.1:8000/api/orders/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify({
              items: state.pendingOrder.items,
              table_no: state.pendingOrder.table_no || state.currentTable
            })
          })
          if (orderRes.ok) {
            // Clear the cart after successful order placement
            clearCart()
            setPendingOrder(null)
            navigate("/order-success", { replace: true })
          } else {
            setError("Failed to place order. Please try again.")
          }
        } else {
          setPendingOrder(null)
          navigate("/menu", { replace: true })
        }
      } else {
        const data = await res.json()
        setError(data.detail || "Invalid OTP")
      }
    } catch (e) {
      setError("Verification failed. Please check your connection.")
    }
    setLoading(false)
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Customer Verification</h1>
      <p className="text-sm text-muted-foreground">
        {state.pendingOrder ? "Verify your details to complete the order." : "Enter phone and email to receive OTP."}
      </p>

      {error && (
        <Alert className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={sent}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent}
          />
        </div>

        {!sent ? (
          <Button
            disabled={!phone || !email || loading}
            onClick={sendOtp}
            className="w-full"
          >
            {loading ? <Spinner label="Sending OTP..." /> : "Send OTP"}
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                placeholder="Enter OTP (123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <Button
              disabled={!otp || loading}
              onClick={verify}
              className="w-full"
            >
              {loading ? <Spinner label="Verifying..." /> : (state.pendingOrder ? "Verify & Complete Order" : "Verify & Confirm Order")}
            </Button>
            <Button
              variant="outline"
              onClick={resendOtp}
              disabled={resendTimer > 0 || loading}
              className="w-full mt-2"
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </Button>
          </>
        )}
      </div>
      </div>
    </section>
  )
}
