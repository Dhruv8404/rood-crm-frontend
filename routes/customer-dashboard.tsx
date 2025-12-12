"use client"
import { API_BASE } from "@/config/api"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { User, Clock, CheckCircle, CreditCard, History, Bell, MapPin, TrendingUp, ShoppingBag } from "lucide-react"
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
      const currentResponse = await fetch(`${API_BASE}orders/current/?phone=${state.user.phone}&include_paid=false`, {
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
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'preparing': return 'bg-gray-100 text-gray-800'
      case 'ready': return 'bg-gray-100 text-gray-800'
      case 'served': return 'bg-gray-100 text-gray-800'
      case 'paid': return 'bg-gray-100 text-gray-800'
      case 'customer_paid': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3 md:w-4 md:h-4" />
      case 'preparing': return <Clock className="w-3 h-3 md:w-4 md:h-4" />
      case 'ready': return <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
      case 'served': return <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
      case 'paid': return <CreditCard className="w-3 h-3 md:w-4 md:h-4" />
      case 'customer_paid': return <CreditCard className="w-3 h-3 md:w-4 md:h-4" />
      default: return <Clock className="w-3 h-3 md:w-4 md:h-4" />
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 md:h-32 md:w-32 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mb-3 md:mb-4 shadow">
            <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Track your orders and dining experience</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8"
        >
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold">{currentOrders.length}</div>
              <p className="text-xs text-gray-500">In progress</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Orders</CardTitle>
              <History className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-gray-500">All time</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold">₹{totalSpent.toFixed(2)}</div>
              <p className="text-xs text-gray-500">Lifetime value</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Favorite Items</CardTitle>
              <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold">{favoriteItems.length}</div>
              <p className="text-xs text-gray-500">Most ordered</p>
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
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1">
              <TabsTrigger value="current" className="text-xs md:text-sm">Current Orders</TabsTrigger>
              <TabsTrigger value="history" className="text-xs md:text-sm">Order History</TabsTrigger>
              <TabsTrigger value="favorites" className="text-xs md:text-sm">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4 md:space-y-6">
              <div className="grid gap-4 md:gap-6">
                {currentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg md:rounded-xl shadow border border-gray-200 p-4 md:p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                      <div className="flex items-start md:items-center space-x-3 md:space-x-4">
                        <div>
                          <h3 className="text-base md:text-xl font-semibold text-gray-900">Order #{order.id}</h3>
                          <div className="flex items-center text-xs md:text-sm text-gray-600 mt-1">
                            <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Table {order.table_no}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">
                            {order.status === 'customer_paid' ? 'Paid Online' :
                             order.status === 'paid' ? 'Paid at Counter' : order.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-lg md:text-2xl font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center min-w-0">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-8 h-8 md:w-10 md:h-10 rounded mr-2 md:mr-3 object-cover flex-shrink-0"
                                  />
                                )}
                                <span className="text-sm truncate">{item.name}</span>
                              </div>
                              <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap ml-2">
                                × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-900 text-sm md:text-base mb-2">Order Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${order.status === 'pending' ? 'bg-gray-400' : 'bg-gray-800'}`}></div>
                              <span className="text-xs md:text-sm">Order Placed</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${['preparing', 'ready', 'served'].includes(order.status) ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Preparing</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${['ready', 'served'].includes(order.status) ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Ready for Pickup</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${order.status === 'served' ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Served</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {currentOrders.length === 0 && (
                  <div className="text-center py-8 md:py-12">
                    <Clock className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-1 md:mb-2">No Active Orders</h3>
                    <p className="text-gray-500 text-sm md:text-base">Your current orders will appear here</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 md:space-y-6">
              <div className="grid gap-4 md:gap-6">
                {orderHistory.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg md:rounded-xl shadow border border-gray-200 p-4 md:p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                      <div className="flex items-start md:items-center space-x-3 md:space-x-4">
                        <div>
                          <h3 className="text-base md:text-xl font-semibold text-gray-900">Order #{order.id}</h3>
                          <div className="flex items-center text-xs md:text-sm text-gray-600 mt-1">
                            <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Table {order.table_no}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border border-gray-300 text-xs md:text-sm`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">
                            {order.status === 'customer_paid' ? 'Paid Online' :
                             order.status === 'paid' ? 'Paid at Counter' : order.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-lg md:text-2xl font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm md:text-base mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div className="flex items-center min-w-0">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-8 h-8 md:w-10 md:h-10 rounded mr-2 md:mr-3 object-cover flex-shrink-0"
                                  />
                                )}
                                <span className="text-sm truncate">{item.name}</span>
                              </div>
                              <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap ml-2">
                                × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                          <h4 className="font-medium text-gray-900 text-sm md:text-base mb-2">Order Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${['pending', 'preparing', 'ready', 'served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Order Placed</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${['preparing', 'ready', 'served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Preparing</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${['ready', 'served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Ready for Pickup</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${['served', 'paid', 'customer_paid'].includes(order.status) ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Served</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-2 ${['paid', 'customer_paid'].includes(order.status) ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                              <span className="text-xs md:text-sm">Paid</span>
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
                        className="bg-gray-800 hover:bg-gray-900 text-xs md:text-sm"
                        size="sm"
                      >
                        Reorder
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {orderHistory.length === 0 && (
                  <div className="text-center py-8 md:py-12">
                    <History className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-1 md:mb-2">No Order History</h3>
                    <p className="text-gray-500 text-sm md:text-base">Your completed orders will appear here</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4 md:space-y-6">
              <div className="grid gap-3 md:gap-4">
                {favoriteItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 md:w-12 md:h-12 rounded mr-3 md:mr-4 object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">{item.name}</h3>
                          <p className="text-xs md:text-sm text-gray-600">Ordered {item.count} times</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                        #{index + 1} Favorite
                      </Badge>
                    </div>
                  </motion.div>
                ))}

                {favoriteItems.length === 0 && (
                  <div className="text-center py-8 md:py-12">
                    <Bell className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-400" />
                    <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-1 md:mb-2">No Favorites Yet</h3>
                    <p className="text-gray-500 text-sm md:text-base">Your favorite items will appear here after ordering</p>
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
          className="mt-6 md:mt-8"
        >
          <Alert className="border border-gray-200 bg-gray-50">
            <Bell className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-sm text-gray-700">
              Dashboard updates automatically every 15 seconds. You'll be notified when your order status changes.
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    </div>
  )
}