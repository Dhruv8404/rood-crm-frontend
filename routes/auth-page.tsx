"use client"
import { API_BASE } from "@/config/api"
import { useApp } from "@/context/app-context"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Spinner from "@/components/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Smartphone, Mail, Lock, ArrowLeft, Shield, Key, RefreshCw } from "lucide-react"

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
      const res = await fetch(`${API_BASE}auth/customer/register/`, {
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
      const res = await fetch(`${API_BASE}auth/customer/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, email })
      })
      if (res.ok) {
        const data = await res.json()
        loginCustomer(phone, email, data.token)

        // Place the pending order after login
        if (state.pendingOrder) {
          const orderRes = await fetch(`${API_BASE}orders/`, {
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

  const handleBack = () => {
    if (sent) {
      setSent(false)
      setOtp("")
      setResendTimer(0)
    } else {
      navigate(-1)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mb-4 md:mb-6 shadow-lg border-4 border-white/20">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
            Customer Verification
          </h1>
          <p className="text-sm md:text-lg text-gray-600">
            {state.pendingOrder ? "Verify your details to complete the order." : "Enter phone and email to receive OTP."}
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200"
        >
          <div className="p-4 md:p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 md:mb-6"
              >
                <Alert className="border border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {!sent ? (
              <motion.form
                key="phone-email-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  sendOtp()
                }}
              >
                {/* Phone Input */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 md:h-12 border border-gray-300 bg-white rounded-lg pl-10 focus:border-gray-500 transition-colors"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 md:h-12 border border-gray-300 bg-white rounded-lg pl-10 focus:border-gray-500 transition-colors"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    disabled={loading || !phone || !email}
                    className="w-full h-11 md:h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Sending OTP...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Key className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Send OTP
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  verify()
                }}
              >
                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Enter OTP
                  </Label>
                  <div className="text-center">
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 md:h-16 border border-gray-300 bg-white rounded-lg text-center text-xl md:text-2xl font-bold tracking-widest focus:border-gray-500 transition-colors"
                      maxLength={6}
                      required
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      OTP sent to <span className="font-semibold">{phone}</span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      disabled={loading || !otp || otp.length !== 6}
                      className="w-full h-11 md:h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Verifying...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          {state.pendingOrder ? "Verify & Complete Order" : "Verify & Continue"}
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={resendOtp}
                      disabled={resendTimer > 0 || loading}
                      variant="outline"
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {resendTimer > 0 ? (
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {resendTimer}s
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend OTP
                        </div>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg md:rounded-b-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">Secure Verification</h4>
                <p className="text-xs text-gray-600">
                  Your information is protected. We use OTP verification to ensure secure access to your orders.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 md:mt-6 text-center"
        >
          <p className="text-xs md:text-sm text-gray-500">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </motion.div>
      </div>
    </section>
  )
}