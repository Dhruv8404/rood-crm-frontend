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
  Clock,
  CheckCircle,
  Package,
  AlertCircle
} from "lucide-react"
import { useState, useEffect } from "react"

export default function AdminDashboard() {
  const { state, fetchOrders } = useApp()
  const [loading, setLoading] = useState(true)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await fetchOrders()
      calculateTodayStats()
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateTodayStats = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayPaidOrders = state.orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return order.status === 'paid' && orderDate >= today
    })
    
    const todayTotalOrders = state.orders.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= today
    })

    const todayRevenue = todayPaidOrders.reduce((sum, order) => sum + order.total, 0)
    setTodayRevenue(todayRevenue)
    setTodayOrders(todayTotalOrders.length)
  }

  const history = state.orders.filter((o) => o.status === "paid")
  const pendingOrders = state.orders.filter((o) => o.status === "pending")
  const preparingOrders = state.orders.filter((o) => o.status === "preparing")
  const completedOrders = state.orders.filter((o) => o.status === "completed")
  const unpaidOrders = state.orders.filter((o) => o.status === "completed")

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
          lastOrder: o.created_at
        }
      }
      acc[key].total += o.total
      acc[key].count += 1
      // Keep the most recent order date
      if (o.created_at && new Date(o.created_at) > new Date(acc[key].lastOrder)) {
        acc[key].lastOrder = o.created_at
      }
      return acc
    }, {}),
  ).sort((a, b) => b.total - a.total).slice(0, 5) // Get top 5 customers

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your restaurant operations and track insights</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadDashboardData}
                variant="outline"
                size="sm"
                className="border-gray-300"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue Card */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalOrders} orders
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Revenue */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{todayRevenue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Today
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders.length + preparingOrders.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pending + Preparing
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Customers */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Top Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customerSummary.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    By spending
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Manage restaurant operations efficiently</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/menu">
                  <Button variant="outline" className="w-full h-20 border-gray-300 hover:bg-gray-50 flex flex-col gap-2">
                    <Utensils className="w-6 h-6 text-gray-600" />
                    <span className="font-medium">Menu</span>
                  </Button>
                </Link>

                <Link to="/admin/qr">
                  <Button variant="outline" className="w-full h-20 border-gray-300 hover:bg-gray-50 flex flex-col gap-2">
                    <QrCode className="w-6 h-6 text-gray-600" />
                    <span className="font-medium">QR Codes</span>
                  </Button>
                </Link>

                <Link to="/admin/orders">
                  <Button variant="outline" className="w-full h-20 border-gray-300 hover:bg-gray-50 flex flex-col gap-2">
                    <ShoppingCart className="w-6 h-6 text-gray-600" />
                    <span className="font-medium">Orders</span>
                  </Button>
                </Link>

                <Link to="/admin/kitchen">
                  <Button variant="outline" className="w-full h-20 border-gray-300 hover:bg-gray-50 flex flex-col gap-2">
                    <ChefHat className="w-6 h-6 text-gray-600" />
                    <span className="font-medium">Kitchen</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer History */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Customers
              </CardTitle>
              <CardDescription>Customers by total spending</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {customerSummary.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Customer Data</h3>
                  <p className="text-gray-500">Paid orders will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerSummary.map((customer, index) => (
                    <div
                      key={customer.phone + customer.email}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <h4 className="font-medium text-gray-900 truncate">{customer.phone}</h4>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-500" />
                              <p className="text-xs text-gray-600 truncate">{customer.email}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {customer.count} {customer.count === 1 ? 'order' : 'orders'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Last: {new Date(customer.lastOrder).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{customer.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">spent</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Overview */}
          <div className="space-y-6">
            {/* Order Status Cards */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Order Status
                </CardTitle>
                <CardDescription>Current order pipeline</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Pending Orders */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Pending</h4>
                          <p className="text-sm text-gray-600">Awaiting preparation</p>
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">
                        {pendingOrders.length}
                      </Badge>
                    </div>
                  </div>

                  {/* In Kitchen Orders */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ChefHat className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">In Kitchen</h4>
                          <p className="text-sm text-gray-600">Being prepared</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">
                        {preparingOrders.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Ready Orders */}
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Ready</h4>
                          <p className="text-sm text-gray-600">Ready for pickup</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {completedOrders.length}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Summary
                </CardTitle>
                <CardDescription>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{todayOrders}</p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">₹{todayRevenue.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Warnings/Notifications */}
        {(pendingOrders.length > 5 || preparingOrders.length > 3) && (
          <div className="mt-6">
            <Card className="border border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">High Order Volume</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {pendingOrders.length > 5 && (
                        <li>{pendingOrders.length} pending orders waiting - consider additional kitchen staff</li>
                      )}
                      {preparingOrders.length > 3 && (
                        <li>{preparingOrders.length} orders in preparation - monitor kitchen capacity</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}