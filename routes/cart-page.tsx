"use client"

import { useApp } from "@/context/app-context"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  ShoppingBag,
  CreditCard,
  Sparkles,
  ChefHat
} from "lucide-react"

export default function CartPage() {
  const { state, removeFromCart, updateQty, clearCart, createOrderFromCart, setPendingOrder } = useApp()
  const navigate = useNavigate()
  const total = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0)

  const handleCheckout = async () => {
    if (state.user.role === "customer" && state.token) {
      const order = await createOrderFromCart()
      if (order) {
        navigate("/order-success", { replace: true })
      }
    } else {
      setPendingOrder({ items: state.cart, table_no: state.currentTable })
      navigate("/auth", { replace: true })
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4 }
    },
    exit: {
      x: 20,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl"
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="rounded-full border-2 border-purple-200 bg-white/80 backdrop-blur-sm hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>

            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-3 shadow-lg border border-purple-200">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>

                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Your Cart
                </h1>

                <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm border-0 text-lg px-4 py-2 shadow-lg">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </Badge>
              </div>

              <p className="mt-2 text-lg text-muted-foreground">
                Review your delicious selections before ordering
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {state.cart.length === 0 ? (
            // EMPTY CART UI
            <motion.div
              key="empty-cart"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-6 h-24 w-24 flex items-center justify-center rounded-full bg-purple-100"
                  >
                    <ShoppingBag className="h-12 w-12 text-purple-600" />
                  </motion.div>

                  <h3 className="mb-4 text-2xl font-semibold text-gray-800">Your cart is empty</h3>

                  <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">
                    Looks like you haven't added anything yet. Let's fix that!
                  </p>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => navigate("/menu")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg px-8 py-6 text-lg font-semibold rounded-2xl"
                      size="lg"
                    >
                      <ChefHat className="w-5 h-5 mr-2" />
                      Explore Menu
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // CART ITEMS
            <motion.div
              key="cart-items"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 lg:grid-cols-3"
            >
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence mode="popLayout">
                  {state.cart.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="rounded-2xl border border-purple-200 bg-white/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
                              <p className="text-lg font-medium text-purple-600 mb-3">₹{item.price.toFixed(2)}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-muted-foreground mb-2">Subtotal</p>
                              <p className="text-lg font-bold text-gray-800">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* QTY + REMOVE */}
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-600">Quantity:</span>

                              <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-inner border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQty(item.id, item.qty - 1)}
                                  className="h-8 w-8 rounded-full p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>

                                <span className="w-8 text-center font-semibold text-gray-800">
                                  {item.qty}
                                </span>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQty(item.id, item.qty + 1)}
                                  className="h-8 w-8 rounded-full p-0 hover:bg-green-50 hover:text-green-600"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Remove */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="rounded-full px-4 py-2 gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Clear Cart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={clearCart}
                      variant="outline"
                      className="rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-6 py-3 font-semibold"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Entire Cart
                    </Button>
                  </motion.div>
                </motion.div>
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:sticky lg:top-6 h-fit"
              >
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <CreditCard className="h-6 w-6" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Price Breakdown */}
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Items ({totalItems})</span>
                        <span className="font-semibold">₹{total.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="text-gray-600">Service Charge</span>
                        <span className="font-semibold">₹{(total * 0.1).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="text-gray-600">GST</span>
                        <span className="font-semibold">₹{(total * 0.05).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between py-4 border-t-2 border-gray-300">
                        <span className="text-xl font-bold text-gray-800">Total Amount</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{(total * 1.15).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Checkout */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => {
                          if (!state.currentTable) navigate("/")
                          else handleCheckout()
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg py-6 text-lg font-semibold rounded-2xl"
                        size="lg"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {state.currentTable ? "Proceed to Checkout" : "Select Table to Continue"}
                      </Button>
                    </motion.div>

                    {/* Add More */}
                    <Button
                      onClick={() => navigate("/menu")}
                      variant="outline"
                      className="w-full rounded-xl border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 py-6 text-lg font-semibold mt-3"
                      size="lg"
                    >
                      <ChefHat className="w-5 h-5 mr-2" />
                      Add More Items
                    </Button>

                    {/* Bottom Info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium">Fast Delivery</span>
                      </div>
                      <p className="text-xs text-blue-600/80 mt-1">
                        Your delicious food will be prepared fresh and served hot!
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
