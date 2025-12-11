"use client"
import { API_BASE } from "@/config/api"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChefHat, Clock, CheckCircle, AlertTriangle, Users, TrendingUp, Timer, Package, RefreshCw } from "lucide-react"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface OrderItem {
  id: number
  name: string
  price: number
  qty: number
  image?: string
}

interface Order {
  id: string
  items: OrderItem[]
  total: number
  status: string
  table_no: string
  created_at: string
  customer: {
    phone: string
    email: string
  }
}

export default function ChefDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { state } = useApp()

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [state.token])

  const fetchOrders = async () => {
    try {
const response = await fetch(`${API_BASE}orders/`, {
  headers: {
    'Authorization': `Bearer ${state.token}`
  }
})


      if (response.ok) {
        const data = await response.json()
        setOrders(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId)
    try {
const response = await fetch(`${API_BASE}orders/${orderId}/`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${state.token}`
  },
  body: JSON.stringify({ status: newStatus })
})

      if (response.ok) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    } finally {
      setUpdatingOrder(null)
    }
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'customer_paid': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'paid': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="w-4 h-4" />
      case 'preparing': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'customer_paid': return <CheckCircle className="w-4 h-4" />
      case 'paid': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const tableOrders = orders.filter(order => order.table_no && order.table_no.trim() !== '')
  const parcelOrders = orders.filter(order => !order.table_no || order.table_no.trim() === '')

  const pendingTableOrders = tableOrders.filter(order => order.status === 'pending')
  const preparingTableOrders = tableOrders.filter(order => order.status === 'preparing')
  const completedTableOrders = tableOrders.filter(order => order.status === 'completed')

  const pendingParcelOrders = parcelOrders.filter(order => order.status === 'pending')
  const preparingParcelOrders = parcelOrders.filter(order => order.status === 'preparing')
  const completedParcelOrders = parcelOrders.filter(order => order.status === 'completed')



  const totalItems = (pendingTableOrders.length + pendingParcelOrders.length) > 0 ?
    [...pendingTableOrders, ...pendingParcelOrders].reduce((total, order) =>
      total + order.items.reduce((sum, item) => sum + item.qty, 0), 0
    ) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-700">Loading Kitchen Dashboard...</h3>
          <p className="text-gray-500 mt-2">Getting orders ready for you</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6 shadow-2xl border-4 border-white/20"
          >
            <ChefHat className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            Chef Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage kitchen operations and track order progress in real-time
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Total Active Orders */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Active Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingTableOrders.length + pendingParcelOrders.length}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    {totalItems} total items
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preparing Orders */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">In Kitchen</p>
                  <p className="text-3xl font-bold text-gray-900">{preparingTableOrders.length + preparingParcelOrders.length}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Being prepared
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ready Orders */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Ready</p>
                  <p className="text-3xl font-bold text-gray-900">{completedTableOrders.length + completedParcelOrders.length}</p>
                  <p className="text-sm text-green-600 mt-1">
                    Ready to serve
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table Orders Pipeline */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-orange-600" />
            Table Orders
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Orders Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Pending
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {pendingTableOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {pendingTableOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border-2 border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <p className="text-sm text-gray-600">Table {order.table_no}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border-0 font-semibold`}>
                          {getStatusIcon(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.slice(0, 3).map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-between items-center p-2 bg-white/50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-800">
                              {item.name} <span className="text-gray-500">×{item.qty}</span>
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </span>
                          </motion.div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500 text-center bg-white/30 py-1 rounded">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
                        <div>
                          <span className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</span>
                          <p className="text-xs text-gray-500">{order.items.length} items</p>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            disabled={updatingOrder === order.id}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg border-0 font-semibold"
                            size="sm"
                          >
                            {updatingOrder === order.id ? (
                              <div className="flex items-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                Starting...
                              </div>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 mr-1" />
                                Start Prep
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {pendingTableOrders.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-gray-500"
                  >
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <h3 className="font-semibold text-gray-600 mb-2">All Clear!</h3>
                    <p className="text-sm">No pending orders</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Preparing Orders Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Preparing
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {preparingTableOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {preparingTableOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <p className="text-sm text-gray-600">Table {order.table_no}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border-0 font-semibold`}>
                          {getStatusIcon(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 bg-white/50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-800">
                              {item.name} <span className="text-gray-500">×{item.qty}</span>
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-blue-600">50%</span>
                        </div>
                        <Progress value={50} className="h-2 bg-blue-200" />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                        <span className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</span>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            disabled={updatingOrder === order.id}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-0 font-semibold"
                            size="sm"
                          >
                            {updatingOrder === order.id ? (
                              <div className="flex items-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                Completing...
                              </div>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Ready
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {preparingTableOrders.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-gray-500"
                  >
                    <Clock className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <h3 className="font-semibold text-gray-600 mb-2">Kitchen Ready</h3>
                    <p className="text-sm">No orders in preparation</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Ready Orders Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Ready
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {completedTableOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {completedTableOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-sm text-gray-600">Table {order.table_no}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border-0 font-semibold`}>
                          {getStatusIcon(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 bg-white/50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-800">
                              {item.name} <span className="text-gray-500">×{item.qty}</span>
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-green-800">Ready for Serving</span>
                          <Timer className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Order completed and ready for customer
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-green-200">
                        <span className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</span>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'paid')}
                            disabled={updatingOrder === order.id}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg border-0 font-semibold"
                            size="sm"
                          >
                            {updatingOrder === order.id ? (
                              <div className="flex items-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                Serving...
                              </div>
                            ) : (
                              <>
                                <Package className="w-4 h-4 mr-1" />
                                Serve
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {completedTableOrders.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-gray-500"
                  >
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                    <h3 className="font-semibold text-gray-600 mb-2">All Served</h3>
                    <p className="text-sm">No orders ready</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          </div>

          {/* Parcel Orders Pipeline */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            Parcel Orders
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Pending Parcels Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Pending Parcels
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {pendingParcelOrders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {pendingParcelOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border-2 border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <p className="text-sm text-gray-600">Phone: {order.customer.phone}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} border-0 font-semibold`}>
                            {getStatusIcon(order.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.slice(0, 3).map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex justify-between items-center p-2 bg-white/50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-800">
                                {item.name} <span className="text-gray-500">×{item.qty}</span>
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </span>
                            </motion.div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-gray-500 text-center bg-white/30 py-1 rounded">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
                          <div>
                            <span className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</span>
                            <p className="text-xs text-gray-500">{order.items.length} items</p>
                          </div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              disabled={updatingOrder === order.id}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg border-0 font-semibold"
                              size="sm"
                            >
                              {updatingOrder === order.id ? (
                                <div className="flex items-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Starting...
                                </div>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 mr-1" />
                                  Start Prep
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {pendingParcelOrders.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-gray-500"
                    >
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                      <h3 className="font-semibold text-gray-600 mb-2">All Clear!</h3>
                      <p className="text-sm">No pending parcels</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Preparing Parcels Column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Preparing Parcels
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {preparingParcelOrders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {preparingParcelOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <p className="text-sm text-gray-600">Phone: {order.customer.phone}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} border-0 font-semibold`}>
                            {getStatusIcon(order.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 bg-white/50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-800">
                                {item.name} <span className="text-gray-500">×{item.qty}</span>
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-blue-600">50%</span>
                          </div>
                          <Progress value={50} className="h-2 bg-blue-200" />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                          <span className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</span>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              disabled={updatingOrder === order.id}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-0 font-semibold"
                              size="sm"
                            >
                              {updatingOrder === order.id ? (
                                <div className="flex items-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Completing...
                                </div>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Mark Ready
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {preparingParcelOrders.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-gray-500"
                    >
                      <Clock className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                      <h3 className="font-semibold text-gray-600 mb-2">Kitchen Ready</h3>
                      <p className="text-sm">No parcels in preparation</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Ready Parcels Column */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Ready Parcels
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {completedParcelOrders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {completedParcelOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <p className="text-sm text-gray-600">Phone: {order.customer.phone}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} border-0 font-semibold`}>
                            {getStatusIcon(order.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 bg-white/50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-800">
                                {item.name} <span className="text-gray-500">×{item.qty}</span>
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-green-800">Ready for Pickup</span>
                            <Timer className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Parcel completed and ready for customer pickup
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-green-200">
                          <span className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</span>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'paid')}
                              disabled={updatingOrder === order.id}
                              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg border-0 font-semibold"
                              size="sm"
                            >
                              {updatingOrder === order.id ? (
                                <div className="flex items-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Serving...
                                </div>
                              ) : (
                                <>
                                  <Package className="w-4 h-4 mr-1" />
                                  Mark Picked
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {completedParcelOrders.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-gray-500"
                    >
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                      <h3 className="font-semibold text-gray-600 mb-2">All Picked</h3>
                      <p className="text-sm">No parcels ready</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>


        </div>

        {/* Real-time Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Alert className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-gray-700">
                  Real-time dashboard • Last updated: {lastUpdated.toLocaleTimeString()}
                </AlertDescription>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={fetchOrders}
                  variant="outline"
                  size="sm"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Now
                </Button>
              </motion.div>
            </div>
          </Alert>
        </motion.div>
      </div>
    </div>
  )
}