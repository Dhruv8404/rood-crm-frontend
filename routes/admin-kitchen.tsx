"use client"

import { useApp } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  ChefHat,
  Clock,
  CheckCircle,
  Utensils,
  AlertCircle,
  Timer,
  Users,
  Phone,
  Mail
} from "lucide-react"

export default function AdminKitchen() {
  const { state, markPreparing, markPrepared } = useApp()

  const pendingOrders = state.orders.filter((o) => o.status === "pending")
  const preparingOrders = state.orders.filter((o) => o.status === "preparing")
  const completedOrders = state.orders.filter((o) => o.status === "completed")

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

  const OrderCard = ({ order, status }: { order: any, status: string }) => (
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                status === 'pending' ? 'bg-orange-500' :
                status === 'preparing' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {status === 'pending' ? <Clock className="w-5 h-5 text-white" /> :
                 status === 'preparing' ? <ChefHat className="w-5 h-5 text-white" /> :
                 <CheckCircle className="w-5 h-5 text-white" />}
              </div>
              <div>
                <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Table {order.table_no || 'N/A'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className={`${
              status === 'pending' ? 'bg-orange-100 text-orange-700' :
              status === 'preparing' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            } border-0`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Customer Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{order.customer.phone}</span>
              <Mail className="w-4 h-4 ml-2" />
              <span>{order.customer.email}</span>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                Items
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-2">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">x{item.qty}</Badge>
                      <span className="text-green-600 font-semibold">₹{item.price * item.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="text-xl font-bold text-green-600">₹{order.total.toFixed(2)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {status === 'pending' && (
                <Button
                  onClick={() => markPreparing(order.id)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  size="sm"
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Start Preparing
                </Button>
              )}
              {status === 'preparing' && (
                <Button
                  onClick={() => markPrepared(order.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Ready
                </Button>
              )}
              {status === 'completed' && (
                <div className="flex-1 text-center text-green-600 font-semibold py-2">
                  ✓
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <section className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-orange-200 mb-4">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Kitchen Dashboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage orders and coordinate with your kitchen staff
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-amber-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">Pending Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingOrders.length}</p>
                    <p className="text-sm text-orange-600 mt-1">
                      Waiting to start
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">In Preparation</p>
                    <p className="text-3xl font-bold text-gray-900">{preparingOrders.length}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Being cooked
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Ready Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{completedOrders.length}</p>
                    <p className="text-sm text-green-600 mt-1">
                      ✓
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-100 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Total Active</p>
                    <p className="text-3xl font-bold text-gray-900">{pendingOrders.length + preparingOrders.length + completedOrders.length}</p>
                    <p className="text-sm text-purple-600 mt-1">
                      All orders
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Orders Sections */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Pending Orders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  Pending Orders
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Orders waiting to be prepared
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Orders</h3>
                    <p className="text-gray-500">New orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {pendingOrders.map((order) => (
                      <OrderCard key={order.id} order={order} status="pending" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Preparing Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="text-xl flex items-center gap-3">
                  <ChefHat className="w-5 h-5" />
                  Preparing
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Orders currently being prepared
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {preparingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders in Preparation</h3>
                    <p className="text-gray-500">Orders being prepared will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {preparingOrders.map((order) => (
                      <OrderCard key={order.id} order={order} status="preparing" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Ready Orders */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm h-full">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="text-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  Ready Orders
                </CardTitle>
                <CardDescription className="text-green-100">
                  Orders ready for pickup
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {completedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Ready Orders</h3>
                    <p className="text-gray-500">Completed orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {completedOrders.map((order) => (
                      <OrderCard key={order.id} order={order} status="completed" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
