"use client"
import { API_BASE } from "@/config/api"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "@/context/app-context"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Plus, Minus, Trash2, ChefHat, Sparkles, Table } from "lucide-react"

export default function MenuPage() {
  const navigate = useNavigate()
  const { addToCart, removeFromCart, updateQty, clearCart, createOrderFromCart, state, fetchOrders, setPendingOrder, setCurrentTable } = useApp()
  const [parcelCart, setParcelCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([])
  const [placingOrder, setPlacingOrder] = useState(false)
  const [customerPlacingOrder, setCustomerPlacingOrder] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [directOrderItem, setDirectOrderItem] = useState<any>(null)
  const [showDirectOrderDialog, setShowDirectOrderDialog] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [tempTableNo, setTempTableNo] = useState("")

  // Handle direct order from menu item
  const handleDirectOrder = (menuItem: any) => {
    setDirectOrderItem(menuItem)
    if (!state.currentTable) {
      setShowTableDialog(true)
    } else {
      setShowDirectOrderDialog(true)
    }
  }

  // Confirm table selection and proceed to order
  const confirmTableSelection = () => {
    if (tempTableNo.trim()) {
      setCurrentTable(tempTableNo.trim())
      setShowTableDialog(false)
      setShowDirectOrderDialog(true)
      setTempTableNo("")
    }
  }

  // Place direct order from menu item
  const placeDirectOrder = async () => {
    if (!directOrderItem) return

    setShowDirectOrderDialog(false)
    setPlacingOrder(true)

    if (!state.token) {
      setPendingOrder({ items: [{ ...directOrderItem, qty: 1 }], table_no: state.currentTable })
      navigate('/auth')
      return
    }

    try {
      const order = {
        id: "ord_" + Math.random().toString(36).slice(2, 9),
        items: [{ ...directOrderItem, qty: 1 }],
        total: directOrderItem.price,
        status: "pending",
        customer: { phone: state.user.phone, email: state.user.email },
        table_no: state.currentTable,
      }

      const response = await fetch(`${API_BASE}orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify(order),
      })

      if (response.ok) {
        navigate('/order-success', { replace: true })
      } else {
        alert('Failed to place order. Please try again.')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Error placing order. Please try again.')
    } finally {
      setPlacingOrder(false)
      setDirectOrderItem(null)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const cartItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      x: 20,
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  }

  // Parcel Cart Functions
  const addToParcelCart = (item: { id: string; name: string; price: number }) => {
    setParcelCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: Math.min(i.qty + 1, 20) } : i)
      } else {
        return [...prev, { ...item, qty: 1 }]
      }
    })
  }

  const removeFromParcelCart = (id: string) => {
    setParcelCart(prev => prev.filter(i => i.id !== id))
  }

  const updateParcelQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromParcelCart(id)
    } else {
      setParcelCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.min(Math.max(1, qty), 20) } : i))
    }
  }

  const placeParcelOrder = async () => {
    if (parcelCart.length === 0 || !state.token) return
    setPlacingOrder(true)
    const total = parcelCart.reduce((sum, i) => sum + i.price * i.qty, 0)
    const id = "ord_" + Math.random().toString(36).slice(2, 9)
    const order = {
      id,
      items: parcelCart,
      total,
      status: "pending",
      customer: { phone: 'Parcel Order', email: 'parcel@foodcrm.com' },
      table_no: null,
    }
    try {
      const response = await fetch(`${API_BASE}orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify(order),
      })
      if (response.ok) {
        setParcelCart([])
        fetchOrders()
        alert('Parcel order placed successfully!')
      } else {
        alert('Failed to place order')
      }
    } catch (error) {
      console.error(error)
      alert('Error placing order')
    }
    setPlacingOrder(false)
  }

  // Customer Order Functions
  const confirmCustomerOrder = async () => {
    setShowConfirmDialog(false)
    setCustomerPlacingOrder(true)
    if (state.token) {
      const order = await createOrderFromCart()
      if (order) {
        navigate('/order-success', { replace: true })
      }
    } else {
      setPendingOrder({ items: state.cart, table_no: null })
      navigate('/auth')
    }
    setCustomerPlacingOrder(false)
  }

  const placeCustomerOrder = () => {
    if (state.cart.length === 0) {
      alert('Your cart is empty')
      return
    }
    setShowConfirmDialog(true)
  }

  // Admin View - Parcel Orders
  if (state.user.role === 'admin') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white rounded-lg md:rounded-full px-4 md:px-6 py-2 md:py-3 shadow border border-gray-200 mb-3 md:mb-4"
            >
              <Package className="h-4 w-4 md:h-5 md:w-5 text-gray-700" />
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                Place Parcel Order
              </h1>
            </motion.div>
            <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
              Select items for takeout orders. Manage parcel orders efficiently.
            </p>
          </div>

          {/* Menu Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {state.menu.map((menuItem) => (
              <motion.div key={menuItem.id} variants={itemVariants}>
                <Card className="overflow-hidden border border-gray-200 shadow hover:shadow-md transition-all duration-300 bg-white">
                  <div className="h-full flex flex-col">
                    <div className="relative overflow-hidden">
                      <img 
                        src={menuItem.image || "/placeholder.svg"} 
                        alt={menuItem.name} 
                        className="h-40 md:h-48 w-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-white text-gray-900 border border-gray-300 text-xs md:text-sm">
                        ₹{menuItem.price.toFixed(2)}
                      </Badge>
                    </div>
                    <CardContent className="p-3 md:p-5 flex-1 flex flex-col">
                      <div className="flex-1">
                        <CardTitle className="text-base md:text-xl mb-1 md:mb-2 line-clamp-1">
                          {menuItem.name}
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm leading-relaxed line-clamp-2 mb-3 md:mb-4">
                          {menuItem.description}
                        </CardDescription>
                      </div>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => addToParcelCart(menuItem)}
                          className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm md:text-base"
                          size="sm"
                        >
                          <Package className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                          Add to Parcel Cart
                        </Button>
                      </motion.div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Parcel Cart Section */}
          <AnimatePresence>
            {parcelCart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.5 }}
                className="mt-8 md:mt-12"
              >
                <Card className="border border-gray-200 shadow bg-white overflow-hidden">
                  <CardHeader className="bg-gray-800 text-white p-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5" />
                      <CardTitle className="text-lg md:text-2xl">Parcel Cart</CardTitle>
                      <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-0 text-xs md:text-sm">
                        {parcelCart.reduce((sum, item) => sum + item.qty, 0)} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6">
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-3 md:space-y-4">
                        {parcelCart.map((item) => (
                          <motion.div
                            key={item.id}
                            variants={cartItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 md:p-4"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm md:text-base truncate">{item.name}</div>
                              <div className="text-xs md:text-sm text-gray-600">₹{item.price.toFixed(2)} each</div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 ml-2">
                              <div className="flex items-center gap-1 md:gap-2 bg-white rounded-lg p-1 border border-gray-300">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateParcelQty(item.id, item.qty - 1)}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-gray-100"
                                >
                                  <Minus className="h-2 w-2 md:h-3 md:w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={item.qty}
                                  onChange={(e) => updateParcelQty(item.id, parseInt(e.target.value) || 1)}
                                  className="w-8 md:w-12 text-center border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateParcelQty(item.id, item.qty + 1)}
                                  className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-gray-100"
                                >
                                  <Plus className="h-2 w-2 md:h-3 md:w-3" />
                                </Button>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFromParcelCart(item.id)}
                                className="rounded-full h-7 w-7 md:h-9 md:w-9 p-0"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </AnimatePresence>
                    
                    {/* Total and Checkout */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-lg md:text-2xl font-bold text-gray-900">
                          Total: ₹{parcelCart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2)}
                        </div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            onClick={placeParcelOrder} 
                            disabled={placingOrder}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 text-sm md:text-base w-full sm:w-auto"
                          >
                            {placingOrder ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mr-2"
                                >
                                  <Sparkles className="h-4 w-4" />
                                </motion.div>
                                Placing Order...
                              </>
                            ) : (
                              <>
                                <Package className="w-4 h-4 mr-2" />
                                Place Parcel Order
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    )
  }

  // Customer View - Regular Menu
  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 md:gap-3 bg-white rounded-lg md:rounded-xl px-4 md:px-8 py-3 md:py-4 shadow border border-gray-200 mb-4 md:mb-6"
          >
            <ChefHat className="h-5 w-5 md:h-7 md:w-7 text-gray-700" />
            <h1 className="text-xl md:text-4xl font-bold text-gray-900">
              Our Delicious Menu
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Discover our handcrafted dishes made with the finest ingredients. 
            <span className="block text-xs md:text-sm mt-1 md:mt-2 text-gray-700 font-medium">
              Pick your favorites and enjoy a delightful experience!
            </span>
          </motion.p>
        </div>

        {/* Menu Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {state.menu.map((menuItem, index) => (
            <motion.div key={menuItem.id} variants={itemVariants} custom={index}>
              <Card className="overflow-hidden border border-gray-200 shadow hover:shadow-md transition-all duration-300 bg-white">
                <div className="h-full flex flex-col">
                  <div className="relative overflow-hidden">
                    <img
                      src={menuItem.image || "/placeholder.svg"}
                      alt={menuItem.name}
                      className="h-40 md:h-52 w-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-white text-gray-900 border border-gray-300 text-xs md:text-sm font-medium">
                      ₹{menuItem.price.toFixed(2)}
                    </Badge>
                  </div>
                  <CardContent className="p-3 md:p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <CardTitle className="text-base md:text-xl font-bold mb-2 md:mb-3 line-clamp-1">
                        {menuItem.name}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-3 text-gray-600">
                        {menuItem.description}
                      </CardDescription>
                    </div>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="mt-3 md:mt-4"
                    >
                      <Button
                        onClick={() => {
                          if (!state.currentTable) {
                            navigate('/')
                          } else {
                            addToCart(menuItem.id)
                          }
                        }}
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm md:text-base"
                        size="sm"
                      >
                        <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </motion.div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Order Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="border border-gray-200 shadow bg-white max-w-md mx-4 md:mx-0">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg md:text-2xl font-bold text-gray-900">
                Confirm Your Order
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm md:text-lg text-gray-600">
                Ready to enjoy your delicious selection? You'll be redirected for verification to complete your order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="rounded-lg px-4 py-2 border border-gray-300 w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCustomerOrder}
                className="bg-gray-800 hover:bg-gray-900 rounded-lg px-4 py-2 text-white font-medium w-full sm:w-auto"
              >
                Confirm Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Table Selection Dialog */}
        <AlertDialog open={showTableDialog} onOpenChange={setShowTableDialog}>
          <AlertDialogContent className="border border-gray-200 shadow bg-white max-w-md mx-4 md:mx-0">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg md:text-2xl font-bold text-gray-900">
                Select Your Table
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm md:text-lg text-gray-600">
                Please enter your table number to place an order. You can find this on the QR code at your table.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-3 md:py-4">
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Table Number</label>
                  <div className="relative">
                    <Table className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter table number (e.g., T1, 5, A12)"
                      value={tempTableNo}
                      onChange={(e) => setTempTableNo(e.target.value)}
                      className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 md:py-3 text-base"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          confirmTableSelection()
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  <p>💡 Tip: Table numbers are usually displayed on the QR code or table sign</p>
                </div>
              </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="rounded-lg px-4 py-2 border border-gray-300 w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmTableSelection}
                disabled={!tempTableNo.trim()}
                className="bg-gray-800 hover:bg-gray-900 rounded-lg px-4 py-2 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Continue to Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Direct Order Confirmation Dialog */}
        <AlertDialog open={showDirectOrderDialog} onOpenChange={setShowDirectOrderDialog}>
          <AlertDialogContent className="border border-gray-200 shadow bg-white max-w-md mx-4 md:mx-0">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg md:text-2xl font-bold text-gray-900">
                Confirm Your Order
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm md:text-lg text-gray-600">
                Ready to enjoy this delicious item? You'll be redirected for verification to complete your order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {directOrderItem && (
              <div className="px-4 md:px-6 pb-3 md:pb-4">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 md:gap-4">
                    {directOrderItem.image && (
                      <img
                        src={directOrderItem.image}
                        alt={directOrderItem.name}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">{directOrderItem.name}</h4>
                      <p className="text-xs md:text-sm text-gray-600">₹{directOrderItem.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">Table: {state.currentTable}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="rounded-lg px-4 py-2 border border-gray-300 w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={placeDirectOrder}
                className="bg-gray-800 hover:bg-gray-900 rounded-lg px-4 py-2 text-white font-medium w-full sm:w-auto"
              >
                Confirm Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </section>
  )
}