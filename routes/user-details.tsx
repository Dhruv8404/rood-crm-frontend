"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  Shield,
  Sparkles,
  User,
  Clock,
  RefreshCw
} from "lucide-react"

export default function UserDetailsPage() {
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"details" | "otp">("details")
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const navigate = useNavigate()
  const { state, loginCustomer } = useApp()

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/send-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          email,
          table_no: state.currentTable,
        }),
      })

      if (response.ok) {
        setStep("otp")
        setResendCooldown(30) // 30 seconds cooldown
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        alert("Failed to send OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error sending OTP:", error)
      alert("Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/customer/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        loginCustomer(phone, email, data.token || "")
        navigate("/menu")
      } else {
        alert("Invalid OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      alert("Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return

    setLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/send-otp/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          email,
          table_no: state.currentTable,
        }),
      })

      if (response.ok) {
        setResendCooldown(30)
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        alert("OTP sent successfully!")
      } else {
        alert("Failed to resend OTP. Please try again.")
      }
    } catch (error) {
      console.error("Error resending OTP:", error)
      alert("Failed to resend OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 shadow-2xl border-4 border-white/20"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {step === "details" ? "Welcome!" : "Verify OTP"}
          </h1>
          <p className="text-lg text-gray-600">
            {step === "details" 
              ? "Enter your details to start ordering" 
              : "Enter the OTP sent to your phone"
            }
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="text-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  {step === "details" ? "Customer Details" : "OTP Verification"}
                </div>
                {state.currentTable && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    Table {state.currentTable}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-purple-100">
                {step === "details" 
                  ? "We'll send a verification code to your phone"
                  : `Enter the 6-digit code sent to ${phone}`
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {step === "details" ? (
                  <motion.form
                    key="details-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleDetailsSubmit}
                    className="space-y-6"
                  >
                    {/* Phone Input */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-12 border-2 border-gray-200 bg-white/50 rounded-xl pl-11 focus:border-purple-500 transition-colors"
                          placeholder="Enter your phone number"
                          required
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <Smartphone className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 border-2 border-gray-200 bg-white/50 rounded-xl pl-11 focus:border-purple-500 transition-colors"
                          placeholder="Enter your email (optional)"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Optional - for order updates and receipts
                      </p>
                    </div>

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={loading || !phone}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg border-0 font-semibold rounded-xl"
                        size="lg"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Sending OTP...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Lock className="w-5 h-5 mr-2" />
                            Send Verification Code
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
                    onSubmit={handleOtpSubmit}
                    className="space-y-6"
                  >
                    {/* OTP Input */}
                    <div className="space-y-4">
                      <Label htmlFor="otp" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Verification Code
                      </Label>
                      <div className="text-center">
                        <Input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-16 border-2 border-gray-200 bg-white/50 rounded-xl text-center text-2xl font-bold tracking-widest focus:border-purple-500 transition-colors"
                          placeholder="000000"
                          maxLength={6}
                          required
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Enter the 6-digit code sent to <strong>{phone}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Resend OTP */}
                    <div className="text-center">
                      <Button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || loading}
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        {resendCooldown > 0 ? (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Resend in {resendCooldown}s
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Resend OTP
                          </div>
                        )}
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          disabled={loading || otp.length !== 6}
                          className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-0 font-semibold rounded-xl"
                          size="lg"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                              />
                              Verifying...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Verify & Continue
                            </div>
                          )}
                        </Button>
                      </motion.div>

                      <Button
                        type="button"
                        onClick={() => setStep("details")}
                        variant="outline"
                        className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Change Details
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Security Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Secure Verification</h4>
                    <p className="text-xs text-blue-700">
                      Your information is protected. We use OTP verification to ensure secure access to your orders.
                    </p>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-500">
            By continuing, you agree to our terms of service and privacy policy
          </p>
        </motion.div>
      </div>
    </section>
  )
}