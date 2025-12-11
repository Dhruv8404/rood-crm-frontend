"use client"
import { API_BASE } from "@/config/api" 
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { User, Clock, CheckCircle, CreditCard, History, Bell, MapPin } from "lucide-react"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  all_orders?: Order[]
}

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("current")
  const { state, addToCart } = useApp()

  useEffect(() => {
    fetchOrders()
    // Set up polling for real-time updates
    const interval = setInterval(fetchOrders, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [state.token, state.user.phone])

  const fetchOrders = async () => {
    try {
      // Fetch current orders (unpaid)
      const currentResponse = await fetch( `${API_BASE}orders/current/?phone=${state.user.phone}&include_paid=false`, {
        headers: {
          'Authorization': `Bearer ${state.token}`
        }
      })

      // Fetch order history (all orders)
      const historyResponse = await fetch(
  `${API_BASE}orders/current/?phone=${state.user.phone}&include_paid=true`,
  {
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  }
)


      if (currentResponse.ok && historyResponse.ok) {
        const currentData = await currentResponse.json()
        const historyData = await historyResponse.json()

        // Combine current and history, avoiding duplicates
        const allOrders = historyData.all_orders || [historyData]
        setOrders(allOrders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'preparing': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'served': return 'bg-gray-100 text-gray-800'
      case 'paid': return 'bg-red-100 text-red-800'
      case 'customer_paid': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'preparing': return <Clock className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'served': return <CheckCircle className="w-4 h-4" />
      case 'paid': return <CreditCard className="w-4 h-4" />
      case 'customer_paid': return <CreditCard className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const currentOrders = orders.filter(order =>
    !['paid', 'customer_paid'].includes(order.status)
  )
  const orderHistory = orders.filter(order =>
    ['paid', 'customer_paid', 'served'].includes(order.status)
  )

  const totalSpent = orderHistory.reduce((sum, order) => sum + order.total, 0)
  const favoriteItems = getFavoriteItems(orders)

  function getFavoriteItems(orders: Order[]) {
    const itemCount: { [key: string]: { name: string, count: number, image?: string } } = {}

    orders.forEach(order => {
      order.items.forEach(item => {
        if (itemCount[item.name]) {
          itemCount[item.name].count += item.qty
        } else {
          itemCount[item.name] = { name: item.name, count: item.qty, image: item.image }
        }
      })
    })

    return Object.values(itemCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600">Track your orders and dining experience</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOrders.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Lifetime value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Items</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoriteItems.length}</div>
              <p className="text-xs text-muted-foreground">Most ordered</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current Orders</TabsTrigger>
              <TabsTrigger value="history">Order History</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-6">
              <div className="grid gap-6">
                {currentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-xl font-semibold">Order #{order.id}</h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            Table {order.table_no}
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">
                            {order.status === 'customer_paid' ? 'Paid Online' :
                             order.status === 'paid' ? 'Paid at Counter' : order.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{order.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-8 h-8 rounded mr-3 object-cover"
                                  />
                                )}
                                <span className="text-sm">{item.name}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Order Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${order.status === 'pending' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                              <span className="text-sm">Order Placed</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${['preparing', 'ready', 'served'].includes(order.status) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Preparing</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${['ready', 'served'].includes(order.status) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Ready for Pickup</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${order.status === 'served' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Served</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {currentOrders.length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Orders</h3>
                    <p className="text-gray-500">Your current orders will appear here</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="grid gap-6">
                {orderHistory.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-xl font-semibold">Order #{order.id}</h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            Table {order.table_no}
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">
                            {order.status === 'customer_paid' ? 'Paid Online' :
                             order.status === 'paid' ? 'Paid at Counter' : order.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{order.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-8 h-8 rounded mr-3 object-cover"
                                  />
                                )}
                                <span className="text-sm">{item.name}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Order Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${['pending', 'preparing', 'ready', 'served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Order Placed</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${['preparing', 'ready', 'served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Preparing</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${['ready', 'served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Ready for Pickup</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${['served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Served</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${['paid', 'customer_paid'].includes(order.status) ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">Paid</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => {
                          // Add items to cart for reordering
                          order.items.forEach(item => {
                            for (let i = 0; i < item.qty; i++) {
                              addToCart(item.id.toString())
                            }
                          })
                          alert('Items added to cart for reordering!')
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Reorder
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {orderHistory.length === 0 && (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Order History</h3>
                    <p className="text-gray-500">Your completed orders will appear here</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <div className="grid gap-4">
                {favoriteItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow p-4 border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded mr-4 object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">Ordered {item.count} times</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        #{index + 1} Favorite
                      </Badge>
                    </div>
                  </motion.div>
                ))}

                {favoriteItems.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Favorites Yet</h3>
                    <p className="text-gray-500">Your favorite items will appear here after ordering</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Real-time Update Alert */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Dashboard updates automatically every 15 seconds. You'll be notified when your order status changes.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </div>
  )
}
