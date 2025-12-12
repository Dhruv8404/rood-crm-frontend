"use client"

import { useApp } from "@/context/app-context"
import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChefHat, UserCog, Lock, Eye, EyeOff, Sparkles, Shield, Utensils } from "lucide-react"
import { API_BASE } from "@/config/api"

export default function LoginPage() {
  const { loginStaff } = useApp()
  const [role, setRole] = useState<"chef" | "admin">("chef")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from || "/"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch(`${API_BASE}auth/staff/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: role, password })
      })
      const data = await res.json()
      if (res.ok) {
        loginStaff(role, data.token)
        navigate(role === 'chef' ? '/chef' : '/admin', { replace: true })
      } else {
        setError("Invalid credentials. Please check your password.")
      }
    } catch (e) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = {
    chef: {
      title: "Chef Login",
      description: "Access kitchen operations and manage orders",
      icon: ChefHat,
      gradient: "from-gray-800 to-gray-900",
      bgGradient: "from-gray-50 to-gray-100",
      color: "gray"
    },
    admin: {
      title: "Admin Login",
      description: "Manage billing, customers, and restaurant operations",
      icon: UserCog,
      gradient: "from-gray-700 to-gray-800",
      bgGradient: "from-gray-100 to-gray-150",
      color: "gray"
    }
  }

  const currentRole = roleConfig[role]

  return (
    <section className={`min-h-screen bg-gradient-to-br ${currentRole.bgGradient} p-4 md:p-8 flex items-center justify-center`}>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full mb-4 md:mb-6 shadow-lg border-4 border-white/20"
          >
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
            Food CRM Portal
          </h1>
          <p className="text-sm md:text-lg text-gray-600">
            Secure access to restaurant management system
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-gray-200 shadow-lg bg-white overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${currentRole.gradient} text-white p-4 md:p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center">
                    <currentRole.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-2xl">{currentRole.title}</CardTitle>
                    <CardDescription className="text-white/80 text-xs md:text-sm">
                      {currentRole.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
              <form onSubmit={submit} className="space-y-4 md:space-y-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    Select Your Role
                  </Label>
                  <Select value={role} onValueChange={(value: "chef" | "admin") => setRole(value)}>
                    <SelectTrigger className="w-full h-11 md:h-12 border border-gray-300 bg-white rounded-lg hover:border-gray-400 transition-colors">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chef" className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        <span className="truncate">Chef - Kitchen Management</span>
                      </SelectItem>
                      <SelectItem value="admin" className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        <span className="truncate">Admin - Billing & Operations</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 md:h-12 border border-gray-300 bg-white rounded-lg pl-10 pr-10 hover:border-gray-400 transition-colors focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    disabled={loading || !password}
                    className={`w-full h-11 md:h-12 bg-gradient-to-r ${currentRole.gradient} hover:opacity-90 text-white font-medium rounded-lg shadow transition-all duration-200`}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        <span className="text-sm md:text-base">Signing In...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Lock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        <span className="text-sm md:text-base">Sign In as {role === 'chef' ? 'Chef' : 'Admin'}</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Role Information */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <currentRole.icon className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm md:text-base">
                      {role === 'chef' ? 'Kitchen Access' : 'Admin Access'}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600">
                      {role === 'chef' 
                        ? 'Manage orders, track preparation status, and coordinate with serving staff.'
                        : 'Process payments, manage customer bills, and oversee restaurant operations.'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Demo Credentials */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-3 text-center"
              >
                <p className="text-xs text-gray-500">
                  Demo credentials: Use "chef" or "admin" as password
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4 md:mt-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-500">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            <span>Secure staff access only. Unauthorized access prohibited.</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}