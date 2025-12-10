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
      const res = await fetch('http://127.0.0.1:8000/api/auth/staff/login/', {
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
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 via-red-50 to-amber-50",
      color: "orange"
    },
    admin: {
      title: "Admin Login",
      description: "Manage billing, customers, and restaurant operations",
      icon: UserCog,
      gradient: "from-blue-500 to-purple-500",
      bgGradient: "from-blue-50 via-indigo-50 to-purple-50",
      color: "blue"
    }
  }

  const currentRole = roleConfig[role]

  return (
    <section className={`min-h-screen bg-gradient-to-br ${currentRole.bgGradient} py-8 px-4`}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full mb-6 shadow-2xl border-4 border-white/20"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            Staff Portal
          </h1>
          <p className="text-lg text-gray-600">
            Secure access to restaurant management systems
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${currentRole.gradient} text-white pb-8`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <currentRole.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{currentRole.title}</CardTitle>
                    <CardDescription className="text-white/80">
                      {currentRole.description}
                    </CardDescription>
                  </div>
                </div>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={submit} className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                    Select Your Role
                  </Label>
                  <Select value={role} onValueChange={(value: "chef" | "admin") => setRole(value)}>
                    <SelectTrigger className="w-full h-12 border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl hover:border-gray-300 transition-colors">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chef" className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        Chef - Kitchen Management
                      </SelectItem>
                      <SelectItem value="admin" className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        Admin - Billing & Operations
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl pl-11 pr-11 hover:border-gray-300 transition-colors focus:border-blue-500"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
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
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={loading || !password}
                    className={`w-full h-12 bg-gradient-to-r ${currentRole.gradient} hover:opacity-90 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 border-0`}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Signing In...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Lock className="w-5 h-5 mr-2" />
                        Sign In as {role === 'chef' ? 'Chef' : 'Admin'}
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
                className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 bg-${currentRole.color}-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <currentRole.icon className={`w-4 h-4 text-${currentRole.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {role === 'chef' ? 'Kitchen Access' : 'Admin Access'}
                    </h4>
                    <p className="text-sm text-gray-600">
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
                className="mt-4 text-center"
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
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Secure staff access only. Unauthorized access prohibited.</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}