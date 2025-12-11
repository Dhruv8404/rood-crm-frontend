"use client"
import { API_BASE } from "@/config/api"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useApp } from "@/context/app-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChefHat, 
  Clock, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Users,
  Phone,
  Mail,
  Sparkles,
  RefreshCw,
  Utensils,
  Package,
  AlertTriangle
} from "lucide-react"

export default function AdminPrepare() {
  const { state, fetchOrders, markPreparing } = useApp()
  const [editingTable, setEditingTable] = useState<string | null>(null)
  const [editTableValue, setEditTableValue] = useState('')
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null)
  const [preparingOrder, setPreparingOrder] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const pendingOrders = state.orders
    .filter(o => o.status === 'pending' || o.status === 'preparing')
    .sort((a, b) => (a.table_no || '').localeCompare(b.table_no || ''))

  const pendingCount = pendingOrders.filter(o => o.status === 'pending').length
  const preparingCount = pendingOrders.filter(o => o.status === 'preparing').length

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const startEditingTable = (orderId: string, currentTable: string) => {
    setEditingTable(orderId)
    setEditTableValue(currentTable || '')
  }

  const saveTableEdit = async () => {
    if (!editingTable || !state.token) return
    try {
      const response = await fetch(API_BASE + `orders/${editingTable}/`, {

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          table_no: editTableValue
        })
      })
      if (response.ok) {
        await fetchOrders()
        setEditingTable(null)
        setEditTableValue('')
      } else {
        alert('Failed to update table number')
      }
    } catch (error) {
      console.error('Error updating table:', error)
      alert('Error updating table number')
    }
  }

  const cancelTableEdit = () => {
    setEditingTable(null)
    setEditTableValue('')
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return
    setDeletingOrder(orderId)
    try {
      const response = await fetch(API_BASE + `orders/${orderId}/`, {

        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })
      if (response.ok) {
        await fetchOrders()
      } else {
        alert('Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Error deleting order')
    }
    setDeletingOrder(null)
  }

  const handleMarkPreparing = async (orderId: string) => {
    setPreparingOrder(orderId)
    try {
      await markPreparing(orderId)
    } catch (error) {
      console.error('Error marking as preparing:', error)
      alert('Error updating order status')
    } finally {
      setPreparingOrder(null)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline'
      case 'preparing': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />
      case 'preparing': return <ChefHat className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/admin">
                <Button variant="outline" size="sm" className="rounded-full border-2 border-orange-200 bg-white/80 backdrop-blur-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-3 shadow-lg border border-orange-200">
                  <ChefHat className="h-6 w-6 text-orange-600" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Order Preparation
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mt-2">
                Manage and track order preparation status
              </p>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              {refreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full"
                />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingOrders.length}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Awaiting preparation
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Ready to start
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">In Kitchen</p>
                  <p className="text-3xl font-bold text-gray-900">{preparingCount}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Being prepared
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <ChefHat className="w-6 h-6" />
                Active Orders
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {pendingOrders.length} orders
                </Badge>
              </CardTitle>
              <CardDescription className="text-orange-100">
                Manage order preparation and table assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-700">Order ID</TableHead>
                      <TableHead className="font-semibold text-gray-700">Table No</TableHead>
                      <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-700">Items</TableHead>
                      <TableHead className="font-semibold text-gray-700">Total</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {pendingOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-center"
                            >
                              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-600 mb-2">All Orders Processed!</h3>
                              <p className="text-gray-500">No pending orders to prepare</p>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingOrders.map((order, index) => (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
                          >
                            <TableCell>
                              <div className="font-mono text-sm font-semibold text-gray-900">
                                #{order.id.slice(-6)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingTable === order.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editTableValue}
                                    onChange={(e) => setEditTableValue(e.target.value)}
                                    className="w-24 h-8 text-sm"
                                    placeholder="Table"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveTableEdit()
                                      if (e.key === 'Escape') cancelTableEdit()
                                    }}
                                    autoFocus
                                  />
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={saveTableEdit} className="h-8 w-8 p-0">
                                      <CheckCircle className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelTableEdit} className="h-8 w-8 p-0">
                                      <AlertTriangle className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="flex items-center gap-2 cursor-pointer group"
                                  onClick={() => startEditingTable(order.id, order.table_no || '')}
                                >
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <span className="text-sm font-bold text-blue-600">
                                      {order.table_no?.replace('Table ', '') || 'N/A'}
                                    </span>
                                  </div>
                                  <Edit className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </motion.div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-900">{order.customer.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-600 truncate max-w-[120px]">
                                    {order.customer.email}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-w-[200px]">
                                {order.items.slice(0, 3).map((item, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-800 truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      ×{item.qty}
                                    </span>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    +{order.items.length - 3} more items
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <span className="font-bold text-gray-900">
                                  ₹{order.total.toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={`${getStatusColor(order.status)} border-2 font-semibold flex items-center gap-1 w-fit`}
                              >
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                {order.status === 'pending' && (
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      onClick={() => handleMarkPreparing(order.id)}
                                      disabled={preparingOrder === order.id}
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                                    >
                                      {preparingOrder === order.id ? (
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                        />
                                      ) : (
                                        <>
                                          <ChefHat className="w-4 h-4 mr-1" />
                                          Start Prep
                                        </>
                                      )}
                                    </Button>
                                  </motion.div>
                                )}
                                {order.status === 'preparing' && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <ChefHat className="w-3 h-3 mr-1" />
                                    In Kitchen
                                  </Badge>
                                )}
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    disabled={deletingOrder === order.id}
                                    className="border-0"
                                  >
                                    {deletingOrder === order.id ? (
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                      />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center pt-6 border-t border-gray-200"
        >
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{pendingOrders.length}</span> active orders • 
            <span className="text-yellow-600 font-semibold ml-2">{pendingCount} pending</span> • 
            <span className="text-blue-600 font-semibold ml-2">{preparingCount} in kitchen</span>
          </div>
          
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Refresh Orders
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}