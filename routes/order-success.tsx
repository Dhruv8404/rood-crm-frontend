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
          color: '#374151' // Changed to gray for classic look
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 md:w-16 md:h-16 border-4 border-gray-200 border-t-gray-800 rounded-full mx-auto mb-4"
          />
          <h3 className="text-base md:text-xl font-semibold text-gray-700">Loading your order...</h3>
          <p className="text-gray-500 mt-2 text-sm md:text-base">Preparing something special for you</p>
        </motion.div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full mx-4 border border-gray-200 shadow bg-white">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 md:h-10 md:w-10 text-gray-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No Order Found</h2>
            <p className="text-gray-600 mb-6 text-sm md:text-base">We couldn't find any active orders for you.</p>
            <Button
              onClick={() => navigate('/menu')}
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-medium"
            >
              Browse Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      <div className="max-w-6xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 md:mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mb-6 md:mb-8 shadow-lg border-4 md:border-8 border-white/20"
          >
            <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Order Confirmed!
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your delicious food is being prepared with love. We'll notify you when it's ready!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Order Progress */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-3"
          >
            <Card className="border border-gray-200 shadow bg-white">
              <CardContent className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Order Progress</h2>
                    <p className="text-gray-600 text-sm md:text-base">Estimated preparation time: <strong>{estimatedTime} minutes</strong></p>
                  </div>
                  {(() => {
                    const orderStatus = order.status || 'pending'
                    const isPaid = ['paid', 'customer_paid'].includes(orderStatus)
                    const isCompleted = orderStatus === 'completed' || orderStatus === 'ready'

                    let badgeText = "In Progress"
                    let badgeColor = "bg-gray-100 text-gray-700"

                    if (orderStatus === 'preparing') {
                      badgeText = "Preparing"
                      badgeColor = "bg-gray-100 text-gray-700"
                    } else if (isCompleted) {
                      badgeText = "Ready"
                      badgeColor = "bg-gray-100 text-gray-700"
                    } else if (orderStatus === 'customer_paid') {
                      badgeText = "Paid"
                      badgeColor = "bg-gray-100 text-gray-700"
                    } else if (orderStatus === 'pending') {
                      badgeText = "Order Received"
                      badgeColor = "bg-gray-100 text-gray-700"
                    }

                    return (
                      <Badge variant="secondary" className={`${badgeColor} px-3 py-1 md:px-4 md:py-2 text-sm md:text-lg border border-gray-300`}>
                        {badgeText}
                      </Badge>
                    )
                  })()}
                </div>

                <div className="space-y-4 md:space-y-6">
                  {/* Progress Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {(() => {
                      const orderStatus = order.status || 'pending'
                      const isPaid = ['paid', 'customer_paid'].includes(orderStatus)
                      const isCompleted = orderStatus === 'completed' || orderStatus === 'ready'

                      // Define steps based on payment and preparation status
                      let steps
                      if (isCompleted && isPaid) {
                        // Order completed and paid
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "gray" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "completed", color: "gray" },
                          { step: 3, label: "Ready", icon: Package, status: "completed", color: "gray" }
                        ]
                      } else if (isPaid) {
                        // Paid but not completed - show payment as completed, preparing as pending
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "gray" },
                          { step: 2, label: "Payment", icon: CreditCard, status: "completed", color: "gray" },
                          { step: 3, label: "Preparing", icon: ChefHat, status: "pending", color: "gray" }
                        ]
                      } else if (orderStatus === 'preparing') {
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "gray" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "current", color: "gray" },
                          { step: 3, label: "Ready", icon: Package, status: "pending", color: "gray" }
                        ]
                      } else if (isCompleted) {
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "gray" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "completed", color: "gray" },
                          { step: 3, label: "Ready", icon: Package, status: "pending", color: "gray" }
                        ]
                      } else {
                        steps = [
                          { step: 1, label: "Order Received", icon: CheckCircle, status: "completed", color: "gray" },
                          { step: 2, label: "Preparing", icon: ChefHat, status: "pending", color: "gray" },
                          { step: 3, label: "Ready", icon: Package, status: "pending", color: "gray" }
                        ]
                      }

                      return steps.map(({ step, label, icon: Icon, status, color }) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + step * 0.1 }}
                          className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border ${
                            status === "completed"
                              ? "border-gray-300 bg-gray-50"
                              : status === "current"
                              ? "border-gray-800 bg-gray-100 shadow"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                            status === "completed"
                              ? "bg-gray-800 text-white"
                              : status === "current"
                              ? "bg-gray-800 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}>
                            <Icon className="w-4 h-4 md:w-6 md:h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm md:text-base">{label}</p>
                            <p className={`text-xs md:text-sm ${
                              status === "completed" ? "text-gray-600" :
                              status === "current" ? "text-gray-800" :
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
                  <div className="mt-4 md:mt-6">
                    <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
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

                      return <Progress value={progressValue} className="h-2 md:h-3 bg-gray-200" />
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <Card className="border border-gray-200 shadow bg-white">
              <CardHeader className="bg-gray-800 text-white p-4 md:p-6">
                <CardTitle className="text-lg md:text-2xl flex items-center gap-2 md:gap-3">
                  <Clock className="w-5 h-5 md:w-6 md:h-6" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-8">
                {/* Order Info */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
                  {[
                    { label: "Order ID", value: `#${order.id}`, icon: CreditCard, color: "gray" },
                    { label: "Date & Time", value: new Date(order.created_at).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }), icon: Clock, color: "gray" },
                    { label: "Table", value: order.table_no, icon: MapPin, color: "gray" },
                    { label: "Status", value: order.status === 'ready' ? 'Delivered' : order.status,
                      icon: Timer, color: "gray", status: order.status },
                    { label: "Payment", value: ['paid', 'customer_paid'].includes(order.status) ? 'Done' : 'Pending Pay',
                      icon: CreditCard, color: "gray" }
                  ].map(({ label, value, icon: Icon, color, status }) => (
                    <motion.div
                      key={label}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
                        </div>
                        <span className="text-xs md:text-sm font-medium text-gray-600">{label}</span>
                      </div>
                      <p className="text-sm md:text-lg font-semibold text-gray-900 truncate">{value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center">
                    <ChefHat className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-gray-700" />
                    Your Order Items
                  </h3>

                  {order.all_orders && order.all_orders.length > 1 ? (
                    <div className="space-y-4 md:space-y-6">
                      {order.all_orders.map((singleOrder, orderIndex) => (
                        <Card key={singleOrder.id} className="border border-gray-200 bg-gray-50">
                          <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4 gap-2">
                              <h4 className="text-base md:text-lg font-semibold text-gray-900">Order #{singleOrder.id}</h4>
                              <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-300 text-xs md:text-sm">
                                {new Date(singleOrder.created_at).toLocaleDateString('en-IN', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 md:space-y-3">
                              {singleOrder.items.map((item, index) => (
                                <motion.div
                                  key={`${singleOrder.id}-${item.id}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.5 + (orderIndex * 0.2) + index * 0.1 }}
                                  className="flex items-center justify-between p-3 md:p-4 bg-white rounded-lg md:rounded-xl border border-gray-200"
                                >
                                  <div className="flex items-center flex-1 min-w-0">
                                    {item.image && (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl object-cover mr-3 md:mr-4 shadow"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-semibold text-gray-900 text-sm md:text-lg truncate">{item.name}</h5>
                                      <div className="flex items-center gap-2 md:gap-4 mt-1">
                                        <span className="text-xs md:text-sm text-gray-600">₹{item.price.toFixed(2)} each</span>
                                        <span className="text-xs md:text-sm text-gray-500">× {item.qty}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right ml-2">
                                    <span className="font-bold text-gray-900 text-sm md:text-lg">₹{(item.price * item.qty).toFixed(2)}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            
                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-300">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900 text-sm md:text-base">Subtotal</span>
                                <span className="font-bold text-gray-900 text-base md:text-lg">₹{(singleOrder.total || 0).toFixed(2)}</span>
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
                        className="bg-gray-800 rounded-lg md:rounded-xl p-4 md:p-6 text-white"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg md:text-2xl font-bold">Grand Total</span>
                          <span className="text-xl md:text-3xl font-bold">
                            ₹{order.all_orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 md:space-y-4">
                        {order.items && order.items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="flex items-center justify-between p-3 md:p-6 bg-white rounded-lg md:rounded-xl border border-gray-200"
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-14 h-14 md:w-20 md:h-20 rounded-lg md:rounded-xl object-cover mr-4 md:mr-6 shadow"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-base md:text-xl mb-1 md:mb-2 truncate">{item.name}</h4>
                                <div className="flex items-center gap-3 md:gap-6">
                                  <span className="text-sm md:text-lg text-gray-600">₹{item.price.toFixed(2)} each</span>
                                  <span className="text-sm md:text-lg text-gray-500">× {item.qty}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <span className="text-lg md:text-2xl font-bold text-gray-900">₹{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Total */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-300"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl md:text-3xl font-bold text-gray-900">Total Amount</span>
                          <span className="text-2xl md:text-4xl font-bold text-gray-900">
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
            className="space-y-4 md:space-y-6"
          >
            {/* Quick Actions */}
            <Card className="border border-gray-200 shadow bg-white">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 text-center">Order Actions</h3>
                <div className="space-y-3 md:space-y-4">
                  <Button
                    onClick={() => navigate('/menu')}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 md:py-6 text-sm md:text-base font-medium rounded-lg"
                  >
                    <ChefHat className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Order More Food
                  </Button>
                  
                  {hasUnpaidOrders && (
                    <Button
                      onClick={handlePayBill}
                      disabled={paying}
                      className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 md:py-6 text-sm md:text-base font-medium rounded-lg disabled:opacity-50"
                    >
                      {paying ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Processing Payment...
                        </div>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Pay Bill Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="border border-gray-200 shadow bg-gray-50">
              <CardContent className="p-4 md:p-6">
                <div className="text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Need Help?</h4>
                  <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                    Our team is here to assist you with your order
                  </p>
                  <div className="space-y-1 md:space-y-2 text-xs md:text-sm">
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
            className="mt-8 md:mt-12"
          >
            <Card className="border border-gray-200 shadow bg-white">
              <CardHeader className="bg-gray-800 text-white p-4 md:p-6">
                <CardTitle className="text-lg md:text-2xl flex items-center gap-2 md:gap-3">
                  <History className="w-5 h-5 md:w-6 md:h-6" />
                  Your Previous Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-8">
                <div className="grid gap-3 md:gap-4">
                  {orderHistory.slice(0, showAllHistory ? orderHistory.length : 3).map((historyOrder, index) => (
                    <motion.div
                      key={historyOrder.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white rounded-lg md:rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-0">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-lg md:rounded-2xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="text-base md:text-lg font-bold text-gray-900">Order #{historyOrder.id}</h4>
                          <p className="text-gray-600 text-xs md:text-sm">
                            {new Date(historyOrder.created_at).toLocaleDateString('en-IN', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                              {historyOrder.items.length} items
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                              Table {historyOrder.table_no}
                            </Badge>
                            {['paid', 'customer_paid'].includes(historyOrder.status) && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300 text-xs">
                                Paid
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-lg md:text-2xl font-bold text-gray-900">₹{historyOrder.total?.toFixed(2)}</p>
                        <p className="text-xs md:text-sm text-gray-600 font-semibold">Completed</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {orderHistory.length > 3 && !showAllHistory && (
                    <Button
                      onClick={() => setShowAllHistory(true)}
                      variant="outline"
                      className="w-full mt-4 border-gray-300 text-gray-700"
                    >
                      Show More Orders
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}