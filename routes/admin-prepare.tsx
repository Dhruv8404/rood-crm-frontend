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
  AlertTriangle,
  CookingPot,
  List,
  Hash
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
      const response = await fetch(`${API_BASE}orders/${editingTable}/`, {
        method: 'PATCH',
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
      const response = await fetch(`${API_BASE}orders/${orderId}/`, {
        method: 'DELETE',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'preparing': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/admin">
                <Button variant="outline" size="sm" className="rounded-lg border border-gray-300 bg-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Back to Admin</span>
                  <span className="md:hidden">Back</span>
                </Button>
              </Link>
            </motion.div>
            <div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="rounded-lg md:rounded-xl bg-white p-2 md:p-3 shadow border border-gray-200">
                  <ChefHat className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
                </div>
                <h1 className="text-xl md:text-4xl font-bold text-gray-900">
                  Order Preparation
                </h1>
              </div>
              <p className="text-sm md:text-lg text-gray-600 mt-1 md:mt-2">
                Manage and track order preparation status
              </p>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full md:w-auto"
            >
              {refreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span className="hidden md:inline">Refresh</span>
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6"
        >
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">Total Orders</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{pendingOrders.length}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Awaiting preparation
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <List className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">Pending</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{pendingCount}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Ready to start
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm col-span-2 md:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">In Kitchen</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{preparingCount}</p>
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
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardHeader className="bg-gray-800 text-white p-3 md:p-6">
              <CardTitle className="text-lg md:text-2xl flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <div className="flex items-center">
                  <ChefHat className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  <span>Active Orders</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                  {pendingOrders.length} orders
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-200 text-sm md:text-base">
                Manage order preparation and table assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Order ID</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Table</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm hidden md:table-cell">Customer</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Items</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm hidden lg:table-cell">Total</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Status</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {pendingOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 md:py-12">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-center"
                            >
                              <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                              <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-1 md:mb-2">All Orders Processed!</h3>
                              <p className="text-gray-500 text-sm md:text-base">No pending orders to prepare</p>
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
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="py-2 md:py-4">
                              <div className="font-mono text-xs md:text-sm font-medium text-gray-900">
                                #{order.id.slice(-6)}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 md:py-4">
                              {editingTable === order.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editTableValue}
                                    onChange={(e) => setEditTableValue(e.target.value)}
                                    className="w-20 h-7 md:h-8 text-xs md:text-sm"
                                    placeholder="Table"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveTableEdit()
                                      if (e.key === 'Escape') cancelTableEdit()
                                    }}
                                    autoFocus
                                  />
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={saveTableEdit} className="h-7 w-7 p-0">
                                      <CheckCircle className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelTableEdit} className="h-7 w-7 p-0">
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
                                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                    <span className="text-xs md:text-sm font-bold text-gray-700">
                                      {order.table_no?.replace('Table ', '') || 'N/A'}
                                    </span>
                                  </div>
                                  <Edit className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                </motion.div>
                              )}
                            </TableCell>
                            <TableCell className="py-2 md:py-4 hidden md:table-cell">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 md:gap-2">
                                  <Phone className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs md:text-sm font-medium text-gray-900 truncate">{order.customer.phone}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 md:py-4">
                              <div className="space-y-1 max-w-[100px] md:max-w-[200px]">
                                {order.items.slice(0, 1).map((item, index) => (
                                  <div key={index} className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-gray-800 truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-gray-500 ml-1 md:ml-2">
                                      ×{item.qty}
                                    </span>
                                  </div>
                                ))}
                                {order.items.length > 1 && (
                                  <div className="text-xs text-gray-500 bg-gray-100 px-1 md:px-2 py-1 rounded">
                                    +{order.items.length - 1} more items
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 md:py-4 hidden lg:table-cell">
                              <div className="text-right">
                                <span className="font-bold text-gray-900 text-sm md:text-base">
                                  ₹{order.total.toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 md:py-4">
                              <Badge 
                                className={`${getStatusColor(order.status)} border border-gray-300 font-medium flex items-center gap-1 w-fit text-xs md:text-sm`}
                              >
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 md:py-4">
                              <div className="flex flex-col md:flex-row gap-1 md:gap-2 justify-end">
                                {order.status === 'pending' && (
                                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                      onClick={() => handleMarkPreparing(order.id)}
                                      disabled={preparingOrder === order.id}
                                      size="sm"
                                      className="bg-gray-800 hover:bg-gray-900 text-white border-0 text-xs md:text-sm"
                                    >
                                      {preparingOrder === order.id ? (
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          className="w-3 h-3 md:w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                        />
                                      ) : (
                                        <>
                                          <ChefHat className="w-3 h-3 md:w-4 h-4 mr-1" />
                                          <span className="hidden md:inline">Start Prep</span>
                                          <span className="md:hidden">Start</span>
                                        </>
                                      )}
                                    </Button>
                                  </motion.div>
                                )}
                                {order.status === 'preparing' && (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">
                                    <ChefHat className="w-2 h-2 md:w-3 h-3 mr-1" />
                                    Preparing
                                  </Badge>
                                )}
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    disabled={deletingOrder === order.id}
                                    className="bg-gray-700 hover:bg-gray-800 text-white border-0 text-xs md:text-sm"
                                  >
                                    {deletingOrder === order.id ? (
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-3 h-3 md:w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                      />
                                    ) : (
                                      <Trash2 className="w-3 h-3 md:w-4 h-4" />
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
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 md:pt-6 border-t border-gray-200"
        >
          <div className="text-xs md:text-sm text-gray-600">
            <span className="font-semibold">{pendingOrders.length}</span> active orders • 
            <span className="text-gray-700 font-semibold ml-1 md:ml-2">{pendingCount} pending</span> • 
            <span className="text-gray-700 font-semibold ml-1 md:ml-2">{preparingCount} in kitchen</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full md:w-auto">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full text-xs md:text-sm"
              >
                <Sparkles className="w-3 h-3 md:w-4 h-4 mr-2" />
                Refresh Orders
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}