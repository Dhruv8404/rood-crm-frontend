"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChefHat, Sparkles, RefreshCw, Trash2, Clock, Receipt, Table } from "lucide-react"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_BASE } from "@/config/api"

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
    const interval = setInterval(fetchOrders, 30000)
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

  const deleteAllHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all order history? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await fetch(`${API_BASE}orders/delete-history/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })

      if (response.ok) {
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
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'preparing': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'customer_paid': return 'bg-gray-100 text-gray-800'
      case 'paid': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => <Receipt className="w-3 h-3 md:w-4 md:h-4" />

  const historyOrders = orders.filter(order =>
    order.status === 'paid' || order.status === 'customer_paid'
  )

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
          <h3 className="text-base md:text-xl font-semibold text-gray-700">Loading Order History...</h3>
          <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Retrieving completed orders</p>
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
            Order History
          </h1>

          <p className="text-sm md:text-xl text-gray-600 max-w-2xl mx-auto">
            View all completed orders and manage historical data
          </p>
        </motion.div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardHeader className="bg-gray-800 text-white p-4 md:p-6">
              <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-lg md:text-2xl">Completed Orders History</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                    {historyOrders.length}
                  </Badge>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={deleteAllHistory}
                      variant="destructive"
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-800 text-white shadow border-0 text-xs md:text-sm"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      Delete All
                    </Button>
                  </motion.div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {historyOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-gray-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base md:text-lg">
                            Order #{order.id.slice(-6)}
                          </h3>

                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-500 rounded-full"></div>

                            <p className="text-xs md:text-sm text-gray-600">
                              {order.table_no?.trim()
                                ? `Table ${order.table_no}`
                                : `Phone: ${order.customer.phone}`}
                            </p>
                          </div>
                        </div>

                        <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                          {getStatusIcon(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3 md:mb-4">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-2 bg-white rounded"
                          >
                            <span className="text-xs md:text-sm font-medium text-gray-800 truncate">
                              {item.name} ×{item.qty}
                            </span>

                            <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap ml-2">
                              ₹{(item.price * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}

                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500 text-center bg-gray-100 py-1 rounded">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-100 border border-gray-200 rounded p-2 md:p-3 mb-2 md:mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm font-semibold text-gray-800">Order Completed</span>
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                        </div>

                        <p className="text-xs text-gray-600 mt-1">
                          Payment processed successfully
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between pt-3 border-t border-gray-300 gap-2">
                        <span className="font-bold text-gray-900 text-base md:text-lg">
                          ₹{order.total.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-2">
                          {order.table_no?.trim() && (
                            <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                              <Table className="w-3 h-3 mr-1" />
                              Table {order.table_no}
                            </Badge>
                          )}
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            Completed
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {historyOrders.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 md:py-12 text-gray-500"
                >
                  <Sparkles className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-600 text-base md:text-lg mb-1 md:mb-2">No History</h3>
                  <p className="text-sm md:text-base">Completed orders will appear here</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Refresh Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 md:mt-8"
        >
          <Alert className="border border-gray-200 shadow bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-gray-600" />

                <AlertDescription className="text-gray-700 text-sm">
                  Order History • Last updated: {lastUpdated.toLocaleTimeString()}
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