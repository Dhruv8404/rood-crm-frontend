"use client"

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Clock, MapPin, Timer, ChefHat, Package, Sparkles, CreditCard, History } from "lucide-react"
import Confetti from "react-confetti"
import { useApp } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { API_BASE } from "@/config/api"

interface OrderItem {
  id: number
  name: string
  price: number
  qty: number
  image?: string
}

interface Order {
  id: number
  items: OrderItem[]
  total: number
  status: string
  table_no: string
  created_at: string
  all_orders?: Order[]
}

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)
  const [paying, setPaying] = useState(false)
  const [hasUnpaidOrders, setHasUnpaidOrders] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState(15) // minutes
  const [showAllHistory, setShowAllHistory] = useState(false)
  const navigate = useNavigate()
  const { state, markPaid } = useApp()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const unpaidResponse = await fetch(`${API_BASE}orders/current/?phone=${state.user.phone}&include_paid=false`, {

          headers: {
            'Authorization': `Bearer ${state.token}`
          }
        })

        if (unpaidResponse.ok) {
          const unpaidData = await unpaidResponse.json()
          if (unpaidData.error === 'No orders found') {
            const allResponse = await fetch(`${API_BASE}orders/current/?phone=${state.user.phone}&include_paid=true`, {

              headers: {
                'Authorization': `Bearer ${state.token}`
              }
            })
            if (allResponse.ok) {
              const allData = await allResponse.json()
              setOrder(allData)
              setHasUnpaidOrders(false)
            } else {
              navigate('/menu')
            }
          } else {
            const hasUnpaid = unpaidData.all_orders
              ? unpaidData.all_orders.some((order: any) => !['paid', 'customer_paid'].includes(order.status))
              : !['paid', 'customer_paid'].includes(unpaidData.status)
            setHasUnpaidOrders(hasUnpaid)
            setOrder(unpaidData)
          }
        } else {
          const allResponse = await fetch(`${API_BASE}orders/current/?phone=${state.user.phone}&include_paid=true`, {

            headers: {
              'Authorization': `Bearer ${state.token}`
            }
          })
          if (allResponse.ok) {
            const allData = await allResponse.json()
            setOrder(allData)
            setHasUnpaidOrders(false)
          } else {
            navigate('/menu')
          }
        }

        const historyResponse = await fetch(`${API_BASE}orders/`, {

          headers: {
            'Authorization': `Bearer ${state.token}`
          }
        })
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          const allOrders = historyData
            .sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          setOrderHistory(allOrders)
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
        navigate('/menu')
      } finally {
        setLoading(false)
      }
    }

    if (state.user.phone && state.token) {
      fetchOrder()
    } else {
      navigate('/menu')
    }

    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [state.user.phone, state.token, navigate])

  const handlePayBill = async () => {
    if (!order) return

    // Validate that order is in pending status before allowing payment
    const orderStatus = order.status || 'pending'
    if (orderStatus !== 'pending') {
      alert('Payment is only allowed for orders that are pending. Please wait for your order to be prepared.')
      return
    }

    // Add confirmation before proceeding with payment
    const confirmPayment = window.confirm('Are you sure you want to pay for your order now? This will process the payment for all pending items.')
    if (!confirmPayment) return

    setPaying(true)
    try {
      const phone = state.user.phone
      if (!phone) {
        alert('Phone number not found. Please log in again.')
        return
      }

      const createResponse = await fetch(`${API_BASE}payments/create/`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ phone })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.error || 'Failed to create payment order')
      }

      const orderData = await createResponse.json()

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Food Order Payment',
        description: `Payment for ${orderData.orders_count} order(s)`,
        handler: async function (response: any) {
          try {
           const verifyResponse = await fetch(`${API_BASE}payments/verify/`, {

              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
              },
              body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                phone: phone
              })
            })

            if (verifyResponse.ok) {
              alert('Payment successful! Thank you for your order.')
              navigate('/menu')
            } else {
              const errorData = await verifyResponse.json()
              throw new Error(errorData.error || 'Payment verification failed')
            }
          } catch (verifyError) {
            console.error('Payment verification failed:', verifyError)
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: state.user.email || '',
          email: state.user.email || '',
          contact: phone
        },
        theme: {
          color: '#10b981'
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-700">Loading your order...</h3>
          <p className="text-gray-500 mt-2">Preparing something special for you</p>
        </motion.div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="max-w-md w-full mx-4 border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Order Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find any active orders for you.</p>
            <Button
              onClick={() => navigate('/menu')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold"
            >
              Browse Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      <div className="max-w-6xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-8 shadow-2xl border-8 border-white/20"
          >
            <CheckCircle className="w-16 h-16 text-white" />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your delicious food is being prepared with love. We'll notify you when it's ready!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Order Progress */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-3"
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Progress</h2>
                    <p className="text-gray-600">Estimated preparation time: <strong>{estimatedTime} minutes</strong></p>
                  </div>
                  {(() => {
                    const orderStatus = order.status || 'pending'
                    const isPaid = ['paid', 'customer_paid'].includes(orderStatus)
                    const isCompleted = orderStatus === 'completed' || orderStatus === 'ready'

                    let badgeText = "In Progress"
                    let badgeColor = "bg-blue-100 text-blue-700"

                    if (orderStatus === 'preparing') {
                      badgeText = "Preparing"
                      badgeColor = "bg-orange-100 text-orange-700"
                    } else if (isCompleted) {
                      badgeText = "Ready"
                      badgeColor = "bg-green-100 text-green-700"
                    } else if (orderStatus === 'customer_paid') {
                      badgeText = "Paid"
                      badgeColor = "bg-emerald-100 text-emerald-700"
                    } else if (orderStatus === 'pending') {
                      badgeText = "Order Received"
                      badgeColor = "bg-blue-100 text-blue-700"
                    }

                    return (
                      <Badge variant="secondary" className={`${badgeColor} px-4 py-2 text-lg border-0`}>
                        {badgeText}
                      </Badge>
                    )
                  })()}
                </div>

                <div className="space-y-6">
                  {/* Progress Steps */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {(() => {
                      const orderStatus = order.status || 'pending'
                      const isPaid = ['paid', 'customer_paid'].includes(orderStatus)
                      const isCompleted = orderStatus === 'completed' || orderStatus === 'ready'

                      // Define steps based on payment and preparation status
                      let steps
                      if (isCompleted && isPaid) {
                        // Order completed and paid
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "green" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "completed", color: "blue" },
                          { step: 3, label: "Ready", icon: Package, status: "completed", color: "orange" }
                        ]
                      } else if (isPaid) {
                        // Paid but not completed - show payment as completed, preparing as pending
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "green" },
                          { step: 2, label: "Payment", icon: CreditCard, status: "completed", color: "emerald" },
                          { step: 3, label: "Preparing", icon: ChefHat, status: "pending", color: "blue" }
                        ]
                      } else if (orderStatus === 'preparing') {
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "green" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "current", color: "blue" },
                          { step: 3, label: "Ready", icon: Package, status: "pending", color: "orange" }
                        ]
                      } else if (isCompleted) {
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "green" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "completed", color: "blue" },
                          { step: 3, label: "Ready", icon: Package, status: "pending", color: "orange" }
                        ]
                      } else {
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "green" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "pending", color: "blue" },
                          { step: 3, label: "Ready", icon: Package, status: "pending", color: "orange" }
                        ]
                      }

                      return steps.map(({ step, label, icon: Icon, status, color }) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + step * 0.1 }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${
                            status === "completed"
                              ? "border-green-200 bg-green-50"
                              : status === "current"
                              ? "border-blue-200 bg-blue-50 shadow-lg"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            status === "completed"
                              ? "bg-green-500 text-white"
                              : status === "current"
                              ? "bg-blue-500 text-white animate-pulse"
                              : "bg-gray-300 text-gray-600"
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{label}</p>
                            <p className={`text-sm ${
                              status === "completed" ? "text-green-600" :
                              status === "current" ? "text-blue-600" :
                              "text-gray-500"
                            }`}>
                              {status === "completed" ? "Completed" :
                               status === "current" ? "In Progress" :
                               "Pending"}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    })()}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Order Received</span>
                      <span>Ready</span>
                    </div>
                    {(() => {
                      const orderStatus = order.status || 'pending'
                      const isPaid = ['paid', 'customer_paid'].includes(orderStatus)
                      const isCompleted = orderStatus === 'completed' || orderStatus === 'ready' || isPaid

                      let progressValue = 0
                      if (orderStatus === 'preparing') {
                        progressValue = 50
                      } else if (isCompleted) {
                        progressValue = 100
                      } else {
                        progressValue = 25
                      }

                      return <Progress value={progressValue} className="h-3 bg-gray-200" />
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Order Info */}
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  {[
                    { label: "Order ID", value: `#${order.id}`, icon: CreditCard, color: "blue" },
                    { label: "Date & Time", value: new Date(order.created_at).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }), icon: Clock, color: "purple" },
                    { label: "Table", value: order.table_no, icon: MapPin, color: "green" },
                    { label: "Status", value: order.status === 'ready' ? 'Delivered' : order.status,
                      icon: Timer, color: "orange", status: order.status },
                    { label: "Payment", value: ['paid', 'customer_paid'].includes(order.status) ? 'Done' : 'Pending Pay',
                      icon: CreditCard, color: ['paid', 'customer_paid'].includes(order.status) ? 'emerald' : 'red' }
                  ].map(({ label, value, icon: Icon, color, status }) => (
                    <motion.div
                      key={label}
                      whileHover={{ scale: 1.05 }}
                      className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl p-4 border border-${color}-200`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${color}-600`} />
                        </div>
                        <span className="text-sm font-medium text-gray-600">{label}</span>
                      </div>
                      <p className={`text-lg font-semibold text-${color}-700`}>{value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <ChefHat className="w-6 h-6 mr-3 text-purple-600" />
                    Your Order Items
                  </h3>

                  {order.all_orders && order.all_orders.length > 1 ? (
                    <div className="space-y-6">
                      {order.all_orders.map((singleOrder, orderIndex) => (
                        <Card key={singleOrder.id} className="border-2 border-purple-200 bg-purple-50/50">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-900">Order #{singleOrder.id}</h4>
                              <Badge variant="secondary" className="bg-white text-purple-700">
                                {new Date(singleOrder.created_at).toLocaleDateString('en-IN', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </Badge>
                            </div>
                            
                            <div className="space-y-3">
                              {singleOrder.items.map((item, index) => (
                                <motion.div
                                  key={`${singleOrder.id}-${item.id}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.5 + (orderIndex * 0.2) + index * 0.1 }}
                                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center flex-1">
                                    {item.image && (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 rounded-xl object-cover mr-4 shadow-md"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 text-lg">{item.name}</h5>
                                      <div className="flex items-center gap-4 mt-1">
                                        <span className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</span>
                                        <span className="text-sm text-gray-500">× {item.qty}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-gray-900 text-lg">₹{(item.price * item.qty).toFixed(2)}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-purple-200">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">Subtotal</span>
                                <span className="font-bold text-purple-600 text-lg">₹{(singleOrder.total || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Grand Total */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">Grand Total</span>
                          <span className="text-3xl font-bold">
                            ₹{order.all_orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {order.items && order.items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200"
                          >
                            <div className="flex items-center flex-1">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-20 h-20 rounded-2xl object-cover mr-6 shadow-md"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-xl mb-2">{item.name}</h4>
                                <div className="flex items-center gap-6">
                                  <span className="text-lg text-gray-600">₹{item.price.toFixed(2)} each</span>
                                  <span className="text-lg text-gray-500">× {item.qty}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-gray-900">₹{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Total */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 pt-6 border-t-2 border-gray-300"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-3xl font-bold text-gray-900">Total Amount</span>
                          <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ₹{(order.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Order Actions</h3>
                <div className="space-y-4">
                  <Button
                    onClick={() => navigate('/menu')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <ChefHat className="w-5 h-5 mr-2" />
                    Order More Food
                  </Button>
                  
                  {hasUnpaidOrders && (
                    <Button
                      onClick={handlePayBill}
                      disabled={paying}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                      size="lg"
                    >
                      {paying ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Processing Payment...
                        </div>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Pay Bill Now
                        </>
                      )}
                    </Button>
                  )}


                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Our team is here to assist you with your order
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">📞 Call: +91-9876543210</p>
                    <p className="text-gray-700">💬 Ask staff at your table</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Order History */}
        {orderHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <History className="w-6 h-6" />
                  Your Previous Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-4">
                  {orderHistory.map((historyOrder, index) => (
                    <motion.div
                      key={historyOrder.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">Order #{historyOrder.id}</h4>
                          <p className="text-gray-600">
                            {new Date(historyOrder.created_at).toLocaleDateString('en-IN', {
                              month: 'long', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                              {historyOrder.items.length} items
                            </Badge>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">
                              Table {historyOrder.table_no}
                            </Badge>
                            {['paid', 'customer_paid'].includes(historyOrder.status) && (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
                                Paid
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">₹{historyOrder.total?.toFixed(2)}</p>
                        <p className="text-sm text-green-600 font-semibold">Completed</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}