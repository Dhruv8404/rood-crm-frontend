"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  Users, 
  Receipt,
  CheckCircle2,
  Clock,
  ChefHat,
  Sparkles,
  Send
} from "lucide-react"

export default function BillingPage() {
  const { state, fetchOrders } = useApp()
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [sendingBill, setSendingBill] = useState<string | null>(null)
  const [selectedBill, setSelectedBill] = useState<any>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const unpaidBills = useMemo(() => {
    return state.orders
      .filter((o) => o.status !== "paid" && o.status !== "customer_paid")
      .sort((a, b) => {
        const aTable = a.table_no || "ZZZ"
        const bTable = b.table_no || "ZZZ"
        return aTable.localeCompare(bTable)
      })
  }, [state.orders])

  const totalUnpaidAmount = unpaidBills.reduce((sum, bill) => sum + (bill.total || 0), 0)
  const completedBills = unpaidBills.filter(bill => bill.status === 'completed')
  const preparingBills = unpaidBills.filter(bill => bill.status === 'preparing')

  const handleMarkPaid = async (orderId: string) => {
    setMarkingPaid(orderId)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ status: 'paid' }),
      })
      if (response.ok) {
        await fetchOrders()
      } else {
        alert('Failed to mark as paid')
      }
    } catch (error) {
      console.error(error)
      alert('Error marking as paid')
    }
    setMarkingPaid(null)
  }

  const handleSendBill = async (orderId: string) => {
    setSendingBill(orderId)
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/send_bill_email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      })
      if (response.ok) {
        alert('Bill sent successfully to customer email')
      } else {
        const error = await response.json()
        alert(`Failed to send bill: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(error)
      alert('Error sending bill')
    }
    setSendingBill(null)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'preparing': return 'secondary'
      case 'pending': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'preparing': return <ChefHat className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
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
                  Billing Management
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mt-2">
                Manage customer bills and payments efficiently
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Total Unpaid Amount */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Total Unpaid</p>
                  <p className="text-3xl font-bold text-gray-900">₹{totalUnpaidAmount.toFixed(2)}</p>
                  <p className="text-sm text-purple-600 mt-1">
                    Across {unpaidBills.length} bills
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ready for Payment */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Ready for Payment</p>
                  <p className="text-3xl font-bold text-gray-900">{completedBills.length}</p>
                  <p className="text-sm text-green-600 mt-1">
                    Orders completed
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Preparation */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">In Preparation</p>
                  <p className="text-3xl font-bold text-gray-900">{preparingBills.length}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Being prepared
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bills Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Receipt className="w-6 h-6" />
                Unpaid Bills
                <Badge variant="secondary" className="bg-white/20 text-white border-0 ml-2">
                  {unpaidBills.length} bills
                </Badge>
              </CardTitle>
              <CardDescription className="text-blue-100">
                Manage and process customer payments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-700">Customer Details</TableHead>
                      <TableHead className="font-semibold text-gray-700">Table No</TableHead>
                      <TableHead className="font-semibold text-gray-700">Order Items</TableHead>
                      <TableHead className="font-semibold text-gray-700">Amount</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {unpaidBills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-center"
                            >
                              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-600 mb-2">All Bills Paid!</h3>
                              <p className="text-gray-500">No unpaid bills at the moment</p>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        unpaidBills.map((bill, index) => (
                          <motion.tr
                            key={bill.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium text-gray-900">
                                    {bill.customer?.phone || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                    {bill.customer?.email || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-sm font-bold text-blue-600">
                                    {bill.table_no?.replace('Table ', '') || "N/A"}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">
                                  {bill.table_no || "Takeaway"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-w-[200px]">
                                {Array.isArray(bill.items) ? bill.items.slice(0, 2).map((item) => (
                                  <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-800 truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      ×{item.qty}
                                    </span>
                                  </div>
                                )) : "N/A"}
                                {Array.isArray(bill.items) && bill.items.length > 2 && (
                                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    +{bill.items.length - 2} more items
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{bill.total?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(bill.status)} border-2 font-semibold flex items-center gap-1 w-fit`}
                              >
                                {getStatusIcon(bill.status)}
                                <span className="capitalize">{bill.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendBill(bill.id)}
                                    disabled={sendingBill === bill.id}
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                  >
                                    {sendingBill === bill.id ? (
                                      <div className="flex items-center">
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"
                                        />
                                        Sending...
                                      </div>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4 mr-1" />
                                        Send Bill
                                      </>
                                    )}
                                  </Button>
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkPaid(bill.id)}
                                    disabled={markingPaid === bill.id || bill.status !== 'completed'}
                                    className={`${
                                      bill.status === 'completed' 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    } border-0 font-semibold`}
                                  >
                                    {markingPaid === bill.id ? (
                                      <div className="flex items-center">
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                        />
                                        Processing...
                                      </div>
                                    ) : (
                                      <>
                                        <CreditCard className="w-4 h-4 mr-1" />
                                        {bill.status === 'completed' ? 'Mark Paid' : 'Not Ready'}
                                      </>
                                    )}
                                  </Button>
                                </motion.div>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center pt-6 border-t border-gray-200"
        >
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{unpaidBills.length}</span> unpaid bills • 
            Total outstanding: <span className="font-bold text-purple-600">₹{totalUnpaidAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => unpaidBills.forEach(bill => {
                  if (bill.status === 'completed') handleSendBill(bill.id)
                })}
                disabled={unpaidBills.filter(bill => bill.status === 'completed').length === 0}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send All Bills
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => fetchOrders()}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Refresh Bills
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}