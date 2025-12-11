"use client"
import { API_BASE } from "@/config/api"
import { useEffect, useState, useMemo } from "react"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Trash2, 
  Plus, 
  CreditCard, 
  Users, 
  ArrowLeft,
  Edit,
  Receipt,
  Sparkles,
  ChefHat,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Package,
  RefreshCw
} from "lucide-react"
import { menuItems } from "@/data/menu"

export default function AdminOrders() {
  const { state, fetchOrders } = useApp()
  const [editingOrder, setEditingOrder] = useState<string | null>(null)
  const [editTableNo, setEditTableNo] = useState('')
  const [editItems, setEditItems] = useState<any[]>([])
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null)
  const [billingCustomer, setBillingCustomer] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const sortedOrders = [...state.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Group orders by customer phone
  const ordersByCustomer = useMemo(() => {
    const groups: { [key: string]: typeof state.orders } = {}
    sortedOrders.forEach(order => {
      const customer = order.customer.phone
      if (!groups[customer]) {
        groups[customer] = []
      }
      groups[customer].push(order)
    })
    return groups
  }, [sortedOrders])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleEditOrder = (orderId: string, currentTableNo: string, currentItems: any[]) => {
    setEditingOrder(orderId)
    setEditTableNo(currentTableNo || '')
    setEditItems([...currentItems])
  }

  const saveEditOrder = async () => {
    if (!editingOrder || !state.token) return
    try {
      const data: any = {}
      if (editTableNo !== '') data.table_no = editTableNo
      if (editItems.length > 0) data.items = editItems
     const response = await fetch(API_BASE + `orders/${editingOrder}/`, {

        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        await fetchOrders()
        setEditingOrder(null)
        setEditTableNo('')
        setEditItems([])
      } else {
        alert('Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order')
    }
  }

  const updateItemQty = (index: number, qty: number) => {
    const newItems = [...editItems]
    if (qty <= 0) {
      newItems.splice(index, 1)
    } else {
      newItems[index].qty = qty
    }
    setEditItems(newItems)
  }

  const addNewItem = (menuItemId: string) => {
    const menuItem = menuItems.find(item => item.id === menuItemId)
    if (!menuItem) return

    const existingItemIndex = editItems.findIndex(item => item.id === menuItem.id)
    if (existingItemIndex >= 0) {
      const newItems = [...editItems]
      newItems[existingItemIndex].qty += 1
      setEditItems(newItems)
    } else {
      setEditItems([...editItems, {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty: 1
      }])
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return
    setDeletingOrder(orderId)
    try {
     const response = await fetch(API_BASE + `orders/${orderId}/`, {

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

  const handleBillCustomer = async (customerPhone: string) => {
    setBillingCustomer(customerPhone)
    try {
     const response = await fetch(API_BASE + 'customers/bill/', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ phone: customerPhone })
      })
      if (response.ok) {
        const data = await response.json()
        alert(`Customer ${customerPhone} billed successfully! Total: ₹${data.total_bill.toFixed(2)}`)
        await fetchOrders()
      } else {
        const error = await response.json()
        alert(`Failed to bill customer: ${error.error}`)
      }
    } catch (error) {
      console.error('Error billing customer:', error)
      alert('Error billing customer')
    }
    setBillingCustomer(null)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default'
      case 'preparing': return 'secondary'
      case 'completed': return 'default'
      case 'pending': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-3 h-3" />
      case 'preparing': return <ChefHat className="w-3 h-3" />
      case 'completed': return <Package className="w-3 h-3" />
      case 'pending': return <Clock className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
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
                <Button variant="outline" size="sm" className="rounded-full border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </motion.div>
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-3 shadow-lg border border-purple-200">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Customer Billing
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mt-2">
                Manage customer orders and process payments
              </p>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {refreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
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
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-900">{Object.keys(ordersByCustomer).length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Active Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {sortedOrders.filter(o => o.status !== 'paid').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {sortedOrders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Pending Payment</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {sortedOrders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Orders */}
        <div className="space-y-6">
          <AnimatePresence>
            {Object.entries(ordersByCustomer).map(([customerPhone, orders], index) => {
              const totalAmount = orders.reduce((sum, order) => sum + order.total, 0)
              const unpaidOrders = orders.filter(order => order.status !== 'paid')
              const customerEmail = orders[0]?.customer.email || ''

              return (
                <motion.div
                  key={customerPhone}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl flex items-center gap-3">
                            <Users className="w-6 h-6" />
                            Customer Orders
                          </CardTitle>
                          <CardDescription className="text-blue-100">
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{customerPhone}</span>
                              </div>
                              {customerEmail && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span>{customerEmail}</span>
                                </div>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
                          <div className="text-blue-100 text-sm">
                            {orders.length} order{orders.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="bg-blue-100 rounded-xl p-3">
                                  <Receipt className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg">Order #{order.id.slice(-6)}</h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Badge 
                                      className={`${getStatusColor(order.status)} border-2 font-semibold flex items-center gap-1`}
                                    >
                                      {getStatusIcon(order.status)}
                                      <span className="capitalize">{order.status}</span>
                                    </Badge>
                                    {order.table_no && (
                                      <Badge variant="outline" className="bg-white text-gray-700">
                                        Table {order.table_no}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">₹{order.total.toFixed(2)}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="grid gap-2 mb-4">
                              {order.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                  <div>
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                    <div className="text-sm text-gray-600">
                                      ₹{item.price.toFixed(2)} × {item.qty}
                                    </div>
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    ₹{(item.price * item.qty).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                              <Dialog open={editingOrder === order.id} onOpenChange={(open) => !open && setEditingOrder(null)}>
                                <DialogTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleEditOrder(order.id, order.table_no || '', order.items)}
                                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Order
                                    </Button>
                                  </motion.div>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                      <Edit className="w-6 h-6" />
                                      Edit Order #{order.id.slice(-6)}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Update table number and modify order items
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    <div className="space-y-3">
                                      <Label htmlFor="tableNo" className="font-semibold">Table Number</Label>
                                      <Input
                                        id="tableNo"
                                        value={editTableNo}
                                        onChange={(e) => setEditTableNo(e.target.value)}
                                        placeholder="Enter table number"
                                        className="h-12 border-2 border-gray-200 rounded-xl"
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <Label className="font-semibold">Add New Item</Label>
                                      <Select onValueChange={addNewItem}>
                                        <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl">
                                          <SelectValue placeholder="Select a dish to add" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {menuItems.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                              <div className="flex items-center justify-between">
                                                <span>{item.name}</span>
                                                <span className="text-green-600 font-semibold">₹{item.price.toFixed(2)}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-3">
                                      <Label className="font-semibold">Order Items</Label>
                                      <div className="space-y-3 max-h-60 overflow-y-auto p-2">
                                        {editItems.map((item, index) => (
                                          <div key={index} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl bg-white">
                                            <div className="flex-1">
                                              <div className="font-medium text-gray-900">{item.name}</div>
                                              <div className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</div>
                                            </div>
                                            <Input
                                              type="number"
                                              min="0"
                                              value={item.qty}
                                              onChange={(e) => updateItemQty(index, parseInt(e.target.value) || 0)}
                                              className="w-20 h-9 text-center"
                                            />
                                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => updateItemQty(index, 0)}
                                                className="h-9 w-9 p-0"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </motion.div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex gap-3">
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button onClick={saveEditOrder} className="bg-green-600 hover:bg-green-700 text-white">
                                          Save Changes
                                        </Button>
                                      </motion.div>
                                      <Button variant="outline" onClick={() => setEditingOrder(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

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
                                    <Trash2 className="w-4 h-4 mr-2" />
                                  )}
                                  Delete
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Bill Customer Button */}
                      {unpaidOrders.length > 0 && (
                        <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => handleBillCustomer(customerPhone)}
                              disabled={billingCustomer === customerPhone}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg px-8 py-3 font-semibold rounded-xl"
                              size="lg"
                            >
                              {billingCustomer === customerPhone ? (
                                <div className="flex items-center">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Processing Bill...
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <CreditCard className="w-5 h-5 mr-2" />
                                  Bill Customer - ₹{unpaidOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                                </div>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Empty State */}
          {Object.keys(ordersByCustomer).length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-3">No Orders Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                There are no customer orders to display at the moment. Orders will appear here when customers place them.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}