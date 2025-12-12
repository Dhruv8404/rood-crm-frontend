"use client"

import { useApp } from "@/context/app-context"
import { useNavigate } from "react-router-dom"
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
  ChefHat,
  Table
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
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl"
      >
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="rounded-full border border-gray-300 bg-white hover:bg-gray-50 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="rounded-lg md:rounded-xl bg-white p-2 md:p-3 shadow border border-gray-200">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
              </div>

              <h1 className="text-xl md:text-4xl font-bold text-gray-900">
                Your Cart
              </h1>

              <Badge variant="secondary" className="bg-white border border-gray-300 text-sm md:text-lg px-3 py-1 md:px-4 md:py-2">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </Badge>
            </div>
          </div>

          <p className="text-sm md:text-lg text-gray-600">
            Review your delicious selections before ordering
          </p>
          
          {state.currentTable && (
            <div className="mt-3 flex items-center gap-2 text-sm md:text-base">
              <Table className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">Table: {state.currentTable}</span>
            </div>
          )}
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
              <Card className="border border-gray-200 shadow bg-white">
                <CardContent className="p-6 md:p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-4 md:mb-6 h-16 w-16 md:h-24 md:w-24 flex items-center justify-center rounded-full bg-gray-100"
                  >
                    <ShoppingBag className="h-8 w-8 md:h-12 md:w-12 text-gray-600" />
                  </motion.div>

                  <h3 className="mb-2 md:mb-4 text-lg md:text-2xl font-semibold text-gray-800">Your cart is empty</h3>

                  <p className="mb-6 md:mb-8 text-sm md:text-lg text-gray-600 max-w-md mx-auto">
                    Looks like you haven't added anything yet. Let's fix that!
                  </p>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => navigate("/menu")}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 md:px-8 md:py-6 text-sm md:text-base font-medium w-full md:w-auto"
                    >
                      <ChefHat className="w-4 h-4 md:w-5 md:h-5 mr-2" />
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
              className="grid gap-4 md:gap-6 lg:grid-cols-3"
            >
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                <AnimatePresence mode="popLayout">
                  {state.cart.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="rounded-lg md:rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-start justify-between">
                            <div className="mb-3 md:mb-0">
                              <h3 className="text-base md:text-xl font-semibold text-gray-800 mb-1 md:mb-2 truncate">{item.name}</h3>
                              <p className="text-sm md:text-lg font-medium text-gray-700">₹{item.price.toFixed(2)}</p>
                            </div>

                            <div className="text-left md:text-right">
                              <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Subtotal</p>
                              <p className="text-base md:text-lg font-bold text-gray-800">
                                ₹{(item.price * item.qty).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* QTY + REMOVE */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-3 md:mt-4">
                            <div className="flex items-center gap-2 md:gap-3">
                              <span className="text-xs md:text-sm font-medium text-gray-600">Quantity:</span>

                              <div className="flex items-center gap-1 md:gap-2 bg-white rounded-lg p-1 border border-gray-300">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQty(item.id, item.qty - 1)}
                                  className="h-6 w-6 md:h-8 md:w-8 rounded p-0 hover:bg-gray-100"
                                >
                                  <Minus className="h-2 w-2 md:h-3 md:w-3" />
                                </Button>

                                <span className="w-6 md:w-8 text-center font-semibold text-gray-800 text-sm md:text-base">
                                  {item.qty}
                                </span>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQty(item.id, item.qty + 1)}
                                  className="h-6 w-6 md:h-8 md:w-8 rounded p-0 hover:bg-gray-100"
                                >
                                  <Plus className="h-2 w-2 md:h-3 md:w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Remove */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="rounded px-3 py-1 md:px-4 md:py-2 gap-1 md:gap-2 text-xs md:text-sm"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
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
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={clearCart}
                      variant="outline"
                      className="rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 md:px-6 md:py-3 font-medium w-full md:w-auto text-sm md:text-base"
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
                <Card className="border border-gray-200 shadow bg-white">
                  <CardHeader className="bg-gray-800 text-white p-4 md:p-6">
                    <CardTitle className="text-lg md:text-2xl flex items-center gap-2 md:gap-3">
                      <CreditCard className="h-5 w-5 md:h-6 md:w-6" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 md:p-6">
                    {/* Price Breakdown */}
                    <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 text-sm md:text-base">Items ({totalItems})</span>
                        <span className="font-semibold text-sm md:text-base">₹{total.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="text-gray-600 text-sm md:text-base">Service Charge</span>
                        <span className="font-semibold text-sm md:text-base">₹{(total * 0.1).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between py-2 border-t border-gray-200">
                        <span className="text-gray-600 text-sm md:text-base">GST</span>
                        <span className="font-semibold text-sm md:text-base">₹{(total * 0.05).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between py-3 md:py-4 border-t-2 border-gray-300">
                        <span className="text-base md:text-xl font-bold text-gray-800">Total Amount</span>
                        <span className="text-lg md:text-2xl font-bold text-gray-900">
                          ₹{(total * 1.15).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Checkout */}
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button
                        onClick={() => {
                          if (!state.currentTable) navigate("/")
                          else handleCheckout()
                        }}
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 md:py-4 text-sm md:text-base font-medium rounded-lg"
                      >
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        {state.currentTable ? "Proceed to Checkout" : "Select Table to Continue"}
                      </Button>
                    </motion.div>

                    {/* Add More */}
                    <Button
                      onClick={() => navigate("/menu")}
                      variant="outline"
                      className="w-full rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 md:py-4 text-sm md:text-base font-medium mt-2 md:mt-3"
                    >
                      <ChefHat className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Add More Items
                    </Button>

                    {/* Bottom Info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium">Fast Delivery</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
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