"use client"

import { Link } from "react-router-dom"
import { useApp } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  Users,
  DollarSign,
  ShoppingCart,
  QrCode,
  Utensils,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  ChefHat,
  BarChart3,
  Sparkles,
  Clock,
  CheckCircle
} from "lucide-react"

export default function AdminDashboard() {
  const { state } = useApp()

  const history = state.orders.filter((o) => o.status === "paid")
  const pendingOrders = state.orders.filter((o) => o.status === "pending" || o.status === "preparing")
  const completedOrders = state.orders.filter((o) => o.status === "completed")

  // Calculate stats
  const totalRevenue = history.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = history.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const customerSummary = Object.values(
    history.reduce<Record<string, { phone: string; email: string; total: number; count: number; lastOrder: string }>>((acc, o) => {
      const key = `${o.customer.phone}|${o.customer.email}`
      if (!acc[key]) {
        acc[key] = {
          phone: o.customer.phone,
          email: o.customer.email,
          total: 0,
          count: 0,
          lastOrder: o.createdAt ? o.createdAt.toString() : new Date().toISOString()
        }
      }
      acc[key].total += o.total
      acc[key].count += 1
      // Keep the most recent order date
      if (o.createdAt && new Date(o.createdAt) > new Date(acc[key].lastOrder)) {
        acc[key].lastOrder = o.createdAt.toString()
      }
      return acc
    }, {}),
  ).sort((a, b) => b.total - a.total) // Sort by total spent

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-blue-200 mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your restaurant operations and track customer insights
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Total Revenue Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-green-600 mt-1">
                      +{totalOrders} orders
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Orders Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      All time
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Average Order Value */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Avg. Order Value</p>
                    <p className="text-3xl font-bold text-gray-900">₹{averageOrderValue.toFixed(2)}</p>
                    <p className="text-sm text-purple-600 mt-1">
                      Per order
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Customers */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-amber-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">Active Customers</p>
                    <p className="text-3xl font-bold text-gray-900">{customerSummary.length}</p>
                    <p className="text-sm text-orange-600 mt-1">
                      Unique customers
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-blue-100">
                Manage your restaurant operations efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/admin/menu">
                    <Button className="w-full h-24 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg rounded-2xl border-0 flex flex-col gap-2">
                      <Utensils className="w-8 h-8" />
                      <span className="font-semibold text-lg">Manage Menu</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/admin/qr">
                    <Button className="w-full h-24 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg rounded-2xl border-0 flex flex-col gap-2">
                      <QrCode className="w-8 h-8" />
                      <span className="font-semibold text-lg">QR Codes</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/admin/orders">
                    <Button className="w-full h-24 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg rounded-2xl border-0 flex flex-col gap-2">
                      <ShoppingCart className="w-8 h-8" />
                      <span className="font-semibold text-lg">View Orders</span>
                    </Button>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/admin/kitchen">
                    <Button className="w-full h-24 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg rounded-2xl border-0 flex flex-col gap-2">
                      <ChefHat className="w-8 h-8" />
                      <span className="font-semibold text-lg">Kitchen View</span>
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Customer History */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Customer History
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Top customers by total spending
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {customerSummary.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Customer Data Yet</h3>
                    <p className="text-gray-500">Paid orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {customerSummary.map((customer, index) => (
                      <motion.div
                        key={customer.phone + customer.email}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <h4 className="font-semibold text-gray-900 truncate">{customer.phone}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <p className="text-sm text-gray-600 truncate">{customer.email}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">
                                {customer.count} {customer.count === 1 ? 'order' : 'orders'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Last: {new Date(customer.lastOrder).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₹{customer.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">total spent</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Status Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  Order Status
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Current order pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Pending Orders */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Pending Orders</h4>
                          <p className="text-sm text-gray-600">Awaiting preparation</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-lg px-3 py-1 border-0">
                        {pendingOrders.length}
                      </Badge>
                    </div>
                  </div>

                  {/* In Progress Orders */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">In Kitchen</h4>
                          <p className="text-sm text-gray-600">Being prepared</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-lg px-3 py-1 border-0">
                        {state.orders.filter(o => o.status === 'preparing').length}
                      </Badge>
                    </div>
                  </div>

                  {/* Ready Orders */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Ready Orders</h4>
                          <p className="text-sm text-gray-600">Ready for serving</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-lg px-3 py-1 border-0">
                        {completedOrders.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Today's Summary */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200 mt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Today's Performance</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{totalOrders}</p>
                        <p className="text-sm text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}