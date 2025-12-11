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
import { ShoppingCart, Package, Plus, Minus, Trash2, ChefHat, Sparkles } from "lucide-react"

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
      <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-200 mb-4"
            >
              <Package className="h-5 w-5 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Place Parcel Order
              </h1>
            </motion.div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select items for takeout orders. Manage parcel orders efficiently.
            </p>
          </div>

          {/* Menu Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {state.menu.map((menuItem) => (
              <motion.div key={menuItem.id} variants={itemVariants}>
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }} 
                    className="h-full flex flex-col"
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={menuItem.image || "/placeholder.svg"} 
                        alt={menuItem.name} 
                        className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge className="absolute top-3 right-3 bg-white/90 text-black backdrop-blur-sm border-0 shadow-lg">
                        ₹{menuItem.price.toFixed(2)}
                      </Badge>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {menuItem.name}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed line-clamp-2 mb-4">
                          {menuItem.description}
                        </CardDescription>
                      </div>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => addToParcelCart(menuItem)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg border-0"
                          size="lg"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Add to Parcel Cart
                        </Button>
                      </motion.div>
                    </CardContent>
                  </motion.div>
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
                className="mt-12"
              >
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                      <Package className="h-6 w-6" />
                      <CardTitle className="text-2xl">Parcel Cart</CardTitle>
                      <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-0">
                        {parcelCart.reduce((sum, item) => sum + item.qty, 0)} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-4">
                        {parcelCart.map((item) => (
                          <motion.div
                            key={item.id}
                            variants={cartItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white/50 p-4 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-800">{item.name}</div>
                              <div className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-inner border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateParcelQty(item.id, item.qty - 1)}
                                  className="h-8 w-8 rounded-full p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={item.qty}
                                  onChange={(e) => updateParcelQty(item.id, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateParcelQty(item.id, item.qty + 1)}
                                  className="h-8 w-8 rounded-full p-0 hover:bg-green-50 hover:text-green-600"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFromParcelCart(item.id)}
                                className="rounded-full h-9 w-9 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
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
                      className="mt-6 pt-6 border-t border-blue-200/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          Total: ₹{parcelCart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2)}
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            onClick={placeParcelOrder} 
                            disabled={placingOrder}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg px-8 py-6 text-lg font-semibold rounded-2xl"
                            size="lg"
                          >
                            {placingOrder ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mr-2"
                                >
                                  <Sparkles className="h-5 w-5" />
                                </motion.div>
                                Placing Order...
                              </>
                            ) : (
                              <>
                                <Package className="w-5 h-5 mr-2" />
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
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-purple-200 mb-6"
          >
            <ChefHat className="h-7 w-7 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Our Delicious Menu
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Discover our handcrafted dishes made with the finest ingredients. 
            <span className="block text-sm mt-2 text-purple-600 font-medium">
              Pick your favorites and enjoy a delightful experience!
            </span>
          </motion.p>
        </div>

        {/* Menu Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {state.menu.map((menuItem, index) => (
            <motion.div key={menuItem.id} variants={itemVariants} custom={index}>
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm group cursor-pointer">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="h-full flex flex-col"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={menuItem.image || "/placeholder.svg"}
                      alt={menuItem.name}
                      className="h-52 w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Badge className="absolute top-4 right-4 bg-white/95 text-black backdrop-blur-sm border-0 shadow-lg font-semibold text-sm px-3 py-1">
                      ₹{menuItem.price.toFixed(2)}
                    </Badge>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold mb-3 line-clamp-1 group-hover:text-purple-600 transition-colors duration-300">
                        {menuItem.name}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed line-clamp-3 text-gray-600">
                        {menuItem.description}
                      </CardDescription>
                    </div>
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="mt-4"
                      >
                        <Button
                          onClick={() => {
                            if (!state.currentTable) {
                              navigate('/')
                            } else {
                              addToCart(menuItem.id)
                            }
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold py-3 rounded-xl"
                          size="lg"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      </motion.div>
                  </CardContent>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>



        {/* Order Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Confirm Your Order
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg text-gray-600">
                Ready to enjoy your delicious selection? You'll be redirected for verification to complete your order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl px-6 py-2 border-2">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCustomerOrder}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl px-6 py-2 text-white font-semibold"
              >
                Confirm Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Table Selection Dialog */}
        <AlertDialog open={showTableDialog} onOpenChange={setShowTableDialog}>
          <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Select Your Table
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg text-gray-600">
                Please enter your table number to place an order. You can find this on the QR code at your table.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                  <Input
                    type="text"
                    placeholder="Enter table number (e.g., T1, 5, A12)"
                    value={tempTableNo}
                    onChange={(e) => setTempTableNo(e.target.value)}
                    className="w-full border-2 border-blue-200 focus:border-blue-400 rounded-xl px-4 py-3 text-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        confirmTableSelection()
                      }
                    }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>💡 Tip: Table numbers are usually displayed on the QR code or table sign</p>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl px-6 py-2 border-2">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmTableSelection}
                disabled={!tempTableNo.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6 py-2 text-white font-semibold disabled:opacity-50"
              >
                Continue to Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Direct Order Confirmation Dialog */}
        <AlertDialog open={showDirectOrderDialog} onOpenChange={setShowDirectOrderDialog}>
          <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Confirm Your Order
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg text-gray-600">
                Ready to enjoy this delicious item? You'll be redirected for verification to complete your order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {directOrderItem && (
              <div className="px-6 pb-4">
                <div className="p-4 bg-white rounded-xl border border-blue-200">
                  <div className="flex items-center gap-4">
                    {directOrderItem.image && (
                      <img
                        src={directOrderItem.image}
                        alt={directOrderItem.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{directOrderItem.name}</h4>
                      <p className="text-sm text-gray-600">₹{directOrderItem.price.toFixed(2)}</p>
                      <p className="text-xs text-blue-600 mt-1">Table: {state.currentTable}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl px-6 py-2 border-2">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={placeDirectOrder}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl px-6 py-2 text-white font-semibold"
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