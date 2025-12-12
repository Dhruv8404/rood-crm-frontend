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
  Users,
  Phone,
  Mail,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"

export default function AdminKitchen() {
  const { state, markPreparing, markPrepared, fetchOrders } = useApp()
  const [loading, setLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      await fetchOrders()
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPreparing = async (orderId: string) => {
    setUpdatingOrder(orderId)
    try {
      await markPreparing(orderId)
    } catch (err) {
      console.error('Error updating order:', err)
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleMarkPrepared = async (orderId: string) => {
    setUpdatingOrder(orderId)
    try {
      await markPrepared(orderId)
    } catch (err) {
      console.error('Error updating order:', err)
    } finally {
      setUpdatingOrder(null)
    }
  }

  const pendingOrders = state.orders.filter((o) => o.status === "pending")
  const preparingOrders = state.orders.filter((o) => o.status === "preparing")
  const completedOrders = state.orders.filter((o) => o.status === "completed")

  const OrderCard = ({ order, status }: { order: any, status: string }) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            status === 'pending' ? 'bg-amber-100' :
            status === 'preparing' ? 'bg-blue-100' : 'bg-emerald-100'
          }`}>
            {status === 'pending' ? <Clock className="w-4 h-4 text-amber-600" /> :
             status === 'preparing' ? <ChefHat className="w-4 h-4 text-blue-600" /> :
             <CheckCircle className="w-4 h-4 text-emerald-600" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Table {order.table_no || 'N/A'}
            </p>
          </div>
        </div>
        <Badge className={
          status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
          status === 'preparing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
          'bg-emerald-100 text-emerald-700 border-emerald-200'
        }>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      
      {/* Customer Info */}
      <div className="text-xs text-gray-600 mb-3 space-y-1">
        <div className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          <span>{order.customer.phone}</span>
        </div>
        {order.customer.email && (
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span className="truncate">{order.customer.email}</span>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1">
          <Utensils className="w-3 h-3" />
          Items
        </h4>
        <div className="space-y-1">
          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-sm bg-gray-50 rounded px-2 py-1">
              <span className="font-medium truncate">{item.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-1">x{item.qty}</Badge>
                <span className="text-gray-700 font-medium">₹{item.price * item.qty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <span className="font-medium text-gray-900">Total:</span>
        <span className="text-lg font-bold text-gray-900">₹{order.total.toFixed(2)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3">
        {status === 'pending' && (
          <Button
            onClick={() => handleMarkPreparing(order.id)}
            disabled={updatingOrder === order.id}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            {updatingOrder === order.id ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ChefHat className="w-4 h-4 mr-2" />
            )}
            Start Preparing
          </Button>
        )}
        {status === 'preparing' && (
          <Button
            onClick={() => handleMarkPrepared(order.id)}
            disabled={updatingOrder === order.id}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            {updatingOrder === order.id ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Mark Ready
          </Button>
        )}
        {status === 'completed' && (
          <div className="flex-1 text-center text-emerald-600 font-medium py-2 border border-emerald-200 rounded bg-emerald-50">
            Ready for Pickup
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kitchen dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage orders and coordinate with kitchen staff</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadOrders}
                variant="outline"
                size="sm"
                className="border-gray-300"
              >
                Refresh Orders
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">In Preparation</p>
                    <p className="text-2xl font-bold text-gray-900">{preparingOrders.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Ready Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {pendingOrders.length + preparingOrders.length + completedOrders.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Orders Sections */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending Orders */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Pending Orders
              </CardTitle>
              <CardDescription>
                Orders waiting to be prepared
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Orders</h3>
                  <p className="text-gray-500">New orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} status="pending" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preparing Orders */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-blue-600" />
                Preparing
              </CardTitle>
              <CardDescription>
                Orders currently being prepared
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {preparingOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders in Preparation</h3>
                  <p className="text-gray-500">Orders being prepared will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {preparingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} status="preparing" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ready Orders */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Ready Orders
              </CardTitle>
              <CardDescription>
                Orders ready for pickup
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {completedOrders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Ready Orders</h3>
                  <p className="text-gray-500">Completed orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {completedOrders.map((order) => (
                    <OrderCard key={order.id} order={order} status="completed" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <Card className="border border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-2">Kitchen Instructions:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                  <span><strong>Pending:</strong> Click "Start Preparing" when you begin cooking an order</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChefHat className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span><strong>Preparing:</strong> Click "Mark Ready" when the order is complete and ready for pickup</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <span><strong>Ready:</strong> Orders will be picked up by wait staff for delivery to customers</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}