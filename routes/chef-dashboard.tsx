"use client"
import { API_BASE } from "@/config/api"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChefHat, Clock, CheckCircle, AlertTriangle, Users, TrendingUp, Timer, Package, RefreshCw, List, CookingPot, CheckSquare } from "lucide-react"
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
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'preparing': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'customer_paid': return 'bg-gray-100 text-gray-800'
      case 'paid': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
      case 'preparing': return <Clock className="w-3 h-3 md:w-4 md:h-4" />
      case 'completed': return <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
      case 'customer_paid': return <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
      case 'paid': return <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
      default: return <Clock className="w-3 h-3 md:w-4 md:h-4" />
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 md:w-16 md:h-16 border-4 border-gray-200 border-t-gray-800 rounded-full mx-auto mb-3 md:mb-4"
          />
          <h3 className="text-base md:text-xl font-semibold text-gray-700">Loading Kitchen Dashboard...</h3>
          <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Getting orders ready for you</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mb-4 md:mb-6 shadow-lg border-4 border-white/20"
          >
            <ChefHat className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
            Chef Dashboard
          </h1>
          <p className="text-sm md:text-xl text-gray-600 max-w-2xl mx-auto">
            Manage kitchen operations and track order progress in real-time
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8"
        >
          {/* Total Active Orders */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">Active Orders</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{pendingTableOrders.length + pendingParcelOrders.length}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    {totalItems} total items
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <List className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preparing Orders */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">In Kitchen</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{preparingTableOrders.length + preparingParcelOrders.length}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Being prepared
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <CookingPot className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ready Orders */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">Ready</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{completedTableOrders.length + completedParcelOrders.length}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Ready to serve
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table Orders Pipeline */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
            <Users className="w-5 h-5 md:w-6 md:h-6 mr-2 text-gray-700" />
            Table Orders
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Pending Orders Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border border-gray-200 shadow h-full">
              <CardHeader className="bg-gray-800 text-white p-3 md:p-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="text-sm md:text-base">Pending</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                    {pendingTableOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                <AnimatePresence mode="popLayout">
                  {pendingTableOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm md:text-base">Order #{order.id.slice(-6)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-500 rounded-full"></div>
                            <p className="text-xs md:text-sm text-gray-600">Table {order.table_no}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                          {getStatusIcon(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3 md:mb-4">
                        {order.items.slice(0, 2).map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-between items-center p-2 bg-white rounded"
                          >
                            <span className="text-xs md:text-sm font-medium text-gray-800 truncate">
                              {item.name} <span className="text-gray-500">×{item.qty}</span>
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </span>
                          </motion.div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-gray-500 text-center bg-gray-100 py-1 rounded">
                            +{order.items.length - 2} more items
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-3 border-t border-gray-300 gap-2">
                        <div>
                          <span className="font-bold text-gray-900 text-sm md:text-base">₹{order.total.toFixed(2)}</span>
                          <p className="text-xs text-gray-500">{order.items.length} items</p>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            disabled={updatingOrder === order.id}
                            className="bg-gray-800 hover:bg-gray-900 text-white shadow border-0 text-xs md:text-sm w-full md:w-auto"
                            size="sm"
                          >
                            {updatingOrder === order.id ? (
                              <div className="flex items-center justify-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                Starting...
                              </div>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                    className="text-center py-6 md:py-12 text-gray-500"
                  >
                    <CheckCircle className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <h3 className="font-medium text-gray-600 text-sm md:text-base mb-1 md:mb-2">All Clear!</h3>
                    <p className="text-xs md:text-sm">No pending orders</p>
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
            <Card className="border border-gray-200 shadow h-full">
              <CardHeader className="bg-gray-800 text-white p-3 md:p-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="text-sm md:text-base">Preparing</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                    {preparingTableOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                <AnimatePresence mode="popLayout">
                  {preparingTableOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm md:text-base">Order #{order.id.slice(-6)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-800 rounded-full animate-pulse"></div>
                            <p className="text-xs md:text-sm text-gray-600">Table {order.table_no}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                          {getStatusIcon(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3 md:mb-4">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 bg-white rounded"
                          >
                            <span className="text-xs md:text-sm font-medium text-gray-800 truncate">
                              {item.name} <span className="text-gray-500">×{item.qty}</span>
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 md:space-y-3 mb-3">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-700">50%</span>
                        </div>
                        <Progress value={50} className="h-1 md:h-2 bg-gray-200" />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-3 border-t border-gray-300 gap-2">
                        <span className="font-bold text-gray-900 text-sm md:text-base">₹{order.total.toFixed(2)}</span>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            disabled={updatingOrder === order.id}
                            className="bg-gray-800 hover:bg-gray-900 text-white shadow border-0 text-xs md:text-sm w-full md:w-auto"
                            size="sm"
                          >
                            {updatingOrder === order.id ? (
                              <div className="flex items-center justify-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                Completing...
                              </div>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                    className="text-center py-6 md:py-12 text-gray-500"
                  >
                    <Clock className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <h3 className="font-medium text-gray-600 text-sm md:text-base mb-1 md:mb-2">Kitchen Ready</h3>
                    <p className="text-xs md:text-sm">No orders in preparation</p>
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
            <Card className="border border-gray-200 shadow h-full">
              <CardHeader className="bg-gray-800 text-white p-3 md:p-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="text-sm md:text-base">Ready</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                    {completedTableOrders.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                <AnimatePresence mode="popLayout">
                  {completedTableOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm md:text-base">Order #{order.id.slice(-6)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-800 rounded-full"></div>
                            <p className="text-xs md:text-sm text-gray-600">Table {order.table_no}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                          {getStatusIcon(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3 md:mb-4">
                        {order.items.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 bg-white rounded"
                          >
                            <span className="text-xs md:text-sm font-medium text-gray-800 truncate">
                              {item.name} <span className="text-gray-500">×{item.qty}</span>
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-gray-100 border border-gray-200 rounded p-2 md:p-3 mb-2 md:mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm font-semibold text-gray-800">Ready for Serving</span>
                          <Timer className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Order completed and ready for customer
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-3 border-t border-gray-300 gap-2">
                        <span className="font-bold text-gray-900 text-sm md:text-base">₹{order.total.toFixed(2)}</span>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'paid')}
                            disabled={updatingOrder === order.id}
                            className="bg-gray-800 hover:bg-gray-900 text-white shadow border-0 text-xs md:text-sm w-full md:w-auto"
                            size="sm"
                          >
                            {updatingOrder === order.id ? (
                              <div className="flex items-center justify-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                />
                                Serving...
                              </div>
                            ) : (
                              <>
                                <Package className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                    className="text-center py-6 md:py-12 text-gray-500"
                  >
                    <CheckCircle className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <h3 className="font-medium text-gray-600 text-sm md:text-base mb-1 md:mb-2">All Served</h3>
                    <p className="text-xs md:text-sm">No orders ready</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          </div>
        </div>

        {/* Parcel Orders Pipeline */}
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
            <Package className="w-5 h-5 md:w-6 md:h-6 mr-2 text-gray-700" />
            Parcel Orders
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Pending Parcels Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border border-gray-200 shadow h-full">
                <CardHeader className="bg-gray-800 text-white p-3 md:p-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      <span className="text-sm md:text-base">Pending Parcels</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                      {pendingParcelOrders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                  <AnimatePresence mode="popLayout">
                    {pendingParcelOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm md:text-base">Order #{order.id.slice(-6)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-500 rounded-full"></div>
                              <p className="text-xs md:text-sm text-gray-600">Phone: {order.customer.phone}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                            {getStatusIcon(order.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3 md:mb-4">
                          {order.items.slice(0, 2).map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex justify-between items-center p-2 bg-white rounded"
                            >
                              <span className="text-xs md:text-sm font-medium text-gray-800 truncate">
                                {item.name} <span className="text-gray-500">×{item.qty}</span>
                              </span>
                              <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </span>
                            </motion.div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-500 text-center bg-gray-100 py-1 rounded">
                              +{order.items.length - 2} more items
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-3 border-t border-gray-300 gap-2">
                          <div>
                            <span className="font-bold text-gray-900 text-sm md:text-base">₹{order.total.toFixed(2)}</span>
                            <p className="text-xs text-gray-500">{order.items.length} items</p>
                          </div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              disabled={updatingOrder === order.id}
                              className="bg-gray-800 hover:bg-gray-900 text-white shadow border-0 text-xs md:text-sm w-full md:w-auto"
                              size="sm"
                            >
                              {updatingOrder === order.id ? (
                                <div className="flex items-center justify-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Starting...
                                </div>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                      className="text-center py-6 md:py-12 text-gray-500"
                    >
                      <CheckCircle className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                      <h3 className="font-medium text-gray-600 text-sm md:text-base mb-1 md:mb-2">All Clear!</h3>
                      <p className="text-xs md:text-sm">No pending parcels</p>
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
              <Card className="border border-gray-200 shadow h-full">
                <CardHeader className="bg-gray-800 text-white p-3 md:p-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      <span className="text-sm md:text-base">Preparing Parcels</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                      {preparingParcelOrders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                  <AnimatePresence mode="popLayout">
                    {preparingParcelOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm md:text-base">Order #{order.id.slice(-6)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-800 rounded-full animate-pulse"></div>
                              <p className="text-xs md:text-sm text-gray-600">Phone: {order.customer.phone}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                            {getStatusIcon(order.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3 md:mb-4">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 bg-white rounded"
                            >
                              <span className="text-xs md:text-sm font-medium text-gray-800 truncate">
                                {item.name} <span className="text-gray-500">×{item.qty}</span>
                              </span>
                              <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2 md:space-y-3 mb-3">
                          <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-700">50%</span>
                          </div>
                          <Progress value={50} className="h-1 md:h-2 bg-gray-200" />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-3 border-t border-gray-300 gap-2">
                          <span className="font-bold text-gray-900 text-sm md:text-base">₹{order.total.toFixed(2)}</span>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              disabled={updatingOrder === order.id}
                              className="bg-gray-800 hover:bg-gray-900 text-white shadow border-0 text-xs md:text-sm w-full md:w-auto"
                              size="sm"
                            >
                              {updatingOrder === order.id ? (
                                <div className="flex items-center justify-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Completing...
                                </div>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                      className="text-center py-6 md:py-12 text-gray-500"
                    >
                      <Clock className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                      <h3 className="font-medium text-gray-600 text-sm md:text-base mb-1 md:mb-2">Kitchen Ready</h3>
                      <p className="text-xs md:text-sm">No parcels in preparation</p>
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
              <Card className="border border-gray-200 shadow h-full">
                <CardHeader className="bg-gray-800 text-white p-3 md:p-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      <span className="text-sm md:text-base">Ready Parcels</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                      {completedParcelOrders.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                  <AnimatePresence mode="popLayout">
                    {completedParcelOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm md:text-base">Order #{order.id.slice(-6)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-800 rounded-full"></div>
                              <p className="text-xs md:text-sm text-gray-600">Phone: {order.customer.phone}</p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                            {getStatusIcon(order.status)}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3 md:mb-4">
                          {order.items.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 bg-white rounded"
                            >
                              <span className="text-xs md:text-sm font-medium text-gray-800 truncate">
                                {item.name} <span className="text-gray-500">×{item.qty}</span>
                              </span>
                              <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-gray-100 border border-gray-200 rounded p-2 md:p-3 mb-2 md:mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm font-semibold text-gray-800">Ready for Pickup</span>
                            <Timer className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Parcel completed and ready for customer pickup
                          </p>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 md:pt-3 border-t border-gray-300 gap-2">
                          <span className="font-bold text-gray-900 text-sm md:text-base">₹{order.total.toFixed(2)}</span>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => updateOrderStatus(order.id, 'paid')}
                              disabled={updatingOrder === order.id}
                              className="bg-gray-800 hover:bg-gray-900 text-white shadow border-0 text-xs md:text-sm w-full md:w-auto"
                              size="sm"
                            >
                              {updatingOrder === order.id ? (
                                <div className="flex items-center justify-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Serving...
                                </div>
                              ) : (
                                <>
                                  <Package className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                      className="text-center py-6 md:py-12 text-gray-500"
                    >
                      <CheckCircle className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                      <h3 className="font-medium text-gray-600 text-sm md:text-base mb-1 md:mb-2">All Picked</h3>
                      <p className="text-xs md:text-sm">No parcels ready</p>
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
          className="mt-6 md:mt-8"
        >
          <Alert className="border border-gray-200 shadow bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-700 text-sm">
                  Real-time dashboard • Last updated: {lastUpdated.toLocaleTimeString()}
                </AlertDescription>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={fetchOrders}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full md:w-auto text-xs md:text-sm"
                >
                  <RefreshCw className="w-3 h-3 md:w-4 h-4 mr-2" />
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