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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      await fetchOrders()
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sortedOrders = useMemo(() => {
    return [...state.orders].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [state.orders])

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
    await loadOrders()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleEditOrder = (orderId: string, currentTableNo: string, currentItems: any[]) => {
    setEditingOrder(orderId)
    setEditTableNo(currentTableNo || '')
    setEditItems([...currentItems.map(item => ({ ...item }))])
  }

  const saveEditOrder = async () => {
    if (!editingOrder || !state.token) return
    
    try {
      const data: any = {}
      if (editTableNo !== '') data.table_no = editTableNo
      if (editItems.length > 0) data.items = editItems

      const response = await fetch(`${API_BASE}orders/${editingOrder}/`, {
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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update order')
      }
    } catch (error: any) {
      console.error('Error updating order:', error)
      alert(error.message || 'Error updating order')
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
      const response = await fetch(`${API_BASE}orders/${orderId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })
      
      if (response.ok) {
        await fetchOrders()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete order')
      }
    } catch (error: any) {
      console.error('Error deleting order:', error)
      alert(error.message || 'Error deleting order')
    }
    
    setDeletingOrder(null)
  }

  const handleBillCustomer = async (customerPhone: string) => {
    if (!confirm(`Bill customer ${customerPhone} for all unpaid orders?`)) return
    setBillingCustomer(customerPhone)
    
    try {
      const response = await fetch(`${API_BASE}customers/bill/`, {
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to bill customer')
      }
    } catch (error: any) {
      console.error('Error billing customer:', error)
      alert(error.message || 'Error billing customer')
    }
    
    setBillingCustomer(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'preparing': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'completed': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
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

  const getTotalUnpaidAmount = (orders: any[]) => {
    return orders
      .filter(order => order.status !== 'paid')
      .reduce((sum, order) => sum + order.total, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
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
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customer Billing</h1>
                <p className="text-gray-600 mt-1">Manage customer orders and process payments</p>
              </div>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="border-gray-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(ordersByCustomer).length}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sortedOrders.filter(o => o.status !== 'paid').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sortedOrders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Payment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sortedOrders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Orders */}
        <div className="space-y-6">
          <AnimatePresence>
            {Object.entries(ordersByCustomer).map(([customerPhone, orders]) => {
              const totalAmount = orders.reduce((sum, order) => sum + order.total, 0)
              const unpaidOrders = orders.filter(order => order.status !== 'paid')
              const customerEmail = orders[0]?.customer.email || ''
              const unpaidAmount = getTotalUnpaidAmount(orders)

              return (
                <motion.div
                  key={customerPhone}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="border border-gray-200">
                    <CardHeader className="bg-gray-50 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-semibold">Customer Orders</CardTitle>
                          <CardDescription className="mt-2">
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3" />
                                <span className="font-medium">{customerPhone}</span>
                              </div>
                              {customerEmail && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-3 h-3" />
                                  <span>{customerEmail}</span>
                                </div>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">
                            {orders.length} order{orders.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-gray-100 rounded-lg p-2">
                                  <Receipt className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">Order #{order.id.slice(-6)}</h3>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge 
                                      className={`${getStatusColor(order.status)} border font-medium flex items-center gap-1`}
                                    >
                                      {getStatusIcon(order.status)}
                                      <span className="capitalize">{order.status}</span>
                                    </Badge>
                                    {order.table_no && (
                                      <Badge variant="outline" className="bg-white">
                                        Table {order.table_no}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">₹{order.total.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(order.created_at).toLocaleDateString('en-IN')}
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2 mb-4">
                              {order.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                    <div className="text-xs text-gray-600">
                                      ₹{item.price.toFixed(2)} × {item.qty}
                                    </div>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">
                                    ₹{(item.price * item.qty).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4 border-t">
                              <Dialog open={editingOrder === order.id} onOpenChange={(open) => !open && setEditingOrder(null)}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditOrder(order.id, order.table_no || '', order.items)}
                                    className="flex-1 sm:flex-none"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md sm:max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit Order #{order.id.slice(-6)}</DialogTitle>
                                    <DialogDescription>
                                      Update table number and modify order items
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="tableNo">Table Number</Label>
                                      <Input
                                        id="tableNo"
                                        value={editTableNo}
                                        onChange={(e) => setEditTableNo(e.target.value)}
                                        placeholder="Enter table number"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Add New Item</Label>
                                      <Select onValueChange={addNewItem}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a dish to add" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {menuItems.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                              <div className="flex items-center justify-between">
                                                <span>{item.name}</span>
                                                <span className="text-green-600 font-medium">₹{item.price.toFixed(2)}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Order Items</Label>
                                      <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {editItems.map((item, index) => (
                                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                            <div className="flex-1">
                                              <div className="font-medium">{item.name}</div>
                                              <div className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</div>
                                            </div>
                                            <Input
                                              type="number"
                                              min="0"
                                              value={item.qty}
                                              onChange={(e) => updateItemQty(index, parseInt(e.target.value) || 0)}
                                              className="w-16 text-center"
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => updateItemQty(index, 0)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={saveEditOrder} className="flex-1">
                                        Save Changes
                                      </Button>
                                      <Button variant="outline" onClick={() => setEditingOrder(null)} className="flex-1">
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteOrder(order.id)}
                                disabled={deletingOrder === order.id}
                                className="flex-1 sm:flex-none"
                              >
                                {deletingOrder === order.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bill Customer Button */}
                      {unpaidOrders.length > 0 && (
                        <div className="flex justify-end pt-4 mt-4 border-t">
                          <Button
                            onClick={() => handleBillCustomer(customerPhone)}
                            disabled={billingCustomer === customerPhone}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                          >
                            {billingCustomer === customerPhone ? (
                              <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Processing...
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Bill Customer - ₹{unpaidAmount.toFixed(2)}
                              </div>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Empty State */}
          {Object.keys(ordersByCustomer).length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                There are no customer orders to display at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}