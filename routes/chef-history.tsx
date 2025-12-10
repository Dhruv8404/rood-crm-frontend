"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChefHat, Sparkles, RefreshCw, Trash2 } from "lucide-react"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export default function ChefHistory() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { state } = useApp()

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000) // Less frequent for history
    return () => clearInterval(interval)
  }, [state.token])

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/orders/', {
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

  const deleteAllHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/orders/delete-history/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })

      if (response.ok) {
        // Refresh orders after deletion
        fetchOrders()
      } else {
        console.error('Failed to delete history')
      }
    } catch (error) {
      console.error('Failed to delete history:', error)
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
      case 'pending': return <Sparkles className="w-4 h-4" />
      case 'preparing': return <Sparkles className="w-4 h-4" />
      case 'completed': return <Sparkles className="w-4 h-4" />
      case 'customer_paid': return <Sparkles className="w-4 h-4" />
      case 'paid': return <Sparkles className="w-4 h-4" />
      default: return <Sparkles className="w-4 h-4" />
    }
  }

  const historyOrders = orders.filter(order => order.status === 'paid' || order.status === 'customer_paid')

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
          <h3 className="text-xl font-semibold text-gray-700">Loading Order History...</h3>
          <p className="text-gray-500 mt-2">Retrieving completed orders</p>
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
            Order History
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            View all completed orders and manage historical data
          </p>
        </motion.div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-500 to-slate-500 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Completed Orders History
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {historyOrders.length}
                  </Badge>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={deleteAllHistory}
                      variant="destructive"
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white shadow-lg border-0"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete All
                    </Button>
                  </motion.div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {historyOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <p className="text-sm text-gray-600">
                              {order.table_no && order.table_no.trim() !== '' ? `Table ${order.table_no}` : `Phone: ${order.customer.phone}`}
                            </p>
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
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500 text-center bg-white/30 py-1 rounded">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">Order Completed</span>
                          <Sparkles className="w-4 h-4 text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Payment processed successfully
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</span>
                        <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          Completed
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {historyOrders.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-500"
                >
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-600 mb-2">No History</h3>
                  <p className="text-sm">Completed orders will appear here</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Real-time Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Alert className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mt-8">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-gray-700">
                  Order History • Last updated: {lastUpdated.toLocaleTimeString()}
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
