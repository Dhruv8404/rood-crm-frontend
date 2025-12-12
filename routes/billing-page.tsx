"use client"
import { API_BASE } from "@/config/api"
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
  Send,
  Phone,
  RefreshCw
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
    if (!window.confirm('Are you sure you want to mark this bill as paid?')) {
      return
    }
    
    setMarkingPaid(orderId)
    try {
      const response = await fetch(`${API_BASE}orders/${orderId}/`, {
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
      const response = await fetch(`${API_BASE}send_bill_email/`, {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'preparing': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3" />
      case 'preparing': return <ChefHat className="w-3 h-3" />
      case 'pending': return <Clock className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 md:mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="rounded-lg border border-gray-300 bg-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Back to Admin</span>
                    <span className="md:hidden">Back</span>
                  </Button>
                </Link>
              </motion.div>
              <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="rounded-lg md:rounded-xl bg-white p-2 md:p-3 shadow border border-gray-200">
                    <Receipt className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
                  </div>
                  <h1 className="text-xl md:text-4xl font-bold text-gray-900">
                    Billing Management
                  </h1>
                </div>
                <p className="text-sm md:text-lg text-gray-600 mt-1 md:mt-2">
                  Manage customer bills and payments efficiently
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8"
        >
          {/* Total Unpaid Amount */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">Total Unpaid</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">₹{totalUnpaidAmount.toFixed(2)}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Across {unpaidBills.length} bills
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ready for Payment */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">Ready for Payment</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{completedBills.length}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Orders completed
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Preparation */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">In Preparation</p>
                  <p className="text-lg md:text-3xl font-bold text-gray-900">{preparingBills.length}</p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Being prepared
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 rounded-lg md:rounded-xl flex items-center justify-center shadow">
                  <ChefHat className="w-5 h-5 md:w-6 md:h-6 text-white" />
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
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardHeader className="bg-gray-800 text-white p-3 md:p-6">
              <CardTitle className="text-lg md:text-2xl flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <div className="flex items-center">
                  <Receipt className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  <span>Unpaid Bills</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                  {unpaidBills.length} bills
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-200 text-sm md:text-base">
                Manage and process customer payments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Customer Details</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm hidden md:table-cell">Table</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Items</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Amount</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Status</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs md:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {unpaidBills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 md:py-12">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-center"
                            >
                              <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                              <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-1 md:mb-2">All Bills Paid!</h3>
                              <p className="text-gray-500 text-sm md:text-base">No unpaid bills at the moment</p>
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
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="py-3 md:py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 md:gap-2">
                                  <Phone className="w-3 h-3 md:w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span className="font-medium text-gray-900 text-xs md:text-sm truncate">
                                    {bill.customer?.phone || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2">
                                  <Mail className="w-3 h-3 md:w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span className="text-xs text-gray-600 truncate max-w-[120px] md:max-w-[200px]">
                                    {bill.customer?.email || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 md:py-4 hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs md:text-sm font-bold text-gray-700">
                                    {bill.table_no?.replace('Table ', '') || "TA"}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900 text-sm">
                                  {bill.table_no || "Takeaway"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 md:py-4">
                              <div className="space-y-1 max-w-[100px] md:max-w-[200px]">
                                {Array.isArray(bill.items) ? bill.items.slice(0, 1).map((item) => (
                                  <div key={item.id} className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-gray-800 truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-gray-500 ml-1 md:ml-2">
                                      ×{item.qty}
                                    </span>
                                  </div>
                                )) : "N/A"}
                                {Array.isArray(bill.items) && bill.items.length > 1 && (
                                  <div className="text-xs text-gray-500 bg-gray-100 px-1 md:px-2 py-1 rounded">
                                    +{bill.items.length - 1} more items
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 md:py-4">
                              <div className="text-right">
                                <span className="text-sm md:text-lg font-bold text-gray-900">
                                  ₹{bill.total?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 md:py-4">
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(bill.status)} border border-gray-300 font-medium flex items-center gap-1 w-fit text-xs md:text-sm`}
                              >
                                {getStatusIcon(bill.status)}
                                <span className="capitalize">{bill.status}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 md:py-4">
                              <div className="flex flex-col md:flex-row gap-1 md:gap-2 justify-end">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendBill(bill.id)}
                                    disabled={sendingBill === bill.id}
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs md:text-sm w-full md:w-auto"
                                  >
                                    {sendingBill === bill.id ? (
                                      <div className="flex items-center justify-center">
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full mr-1"
                                        />
                                        Sending...
                                      </div>
                                    ) : (
                                      <>
                                        <Send className="w-3 h-3 md:w-4 h-4 mr-1" />
                                        <span className="hidden md:inline">Send Bill</span>
                                        <span className="md:hidden">Send</span>
                                      </>
                                    )}
                                  </Button>
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                  <Button
                                    size="sm"
                                    onClick={() => handleMarkPaid(bill.id)}
                                    disabled={markingPaid === bill.id || bill.status !== 'completed'}
                                    className={`${
                                      bill.status === 'completed' 
                                        ? 'bg-gray-800 hover:bg-gray-900 text-white' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    } text-xs md:text-sm w-full md:w-auto`}
                                  >
                                    {markingPaid === bill.id ? (
                                      <div className="flex items-center justify-center">
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          className="w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-1"
                                        />
                                        Processing...
                                      </div>
                                    ) : (
                                      <>
                                        <CreditCard className="w-3 h-3 md:w-4 h-4 mr-1" />
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
          className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 md:pt-6 border-t border-gray-200"
        >
          <div className="text-xs md:text-sm text-gray-600">
            <span className="font-semibold">{unpaidBills.length}</span> unpaid bills • 
            Total outstanding: <span className="font-bold text-gray-800">₹{totalUnpaidAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => unpaidBills.forEach(bill => {
                  if (bill.status === 'completed') handleSendBill(bill.id)
                })}
                disabled={unpaidBills.filter(bill => bill.status === 'completed').length === 0}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full text-xs md:text-sm"
              >
                <Mail className="w-3 h-3 md:w-4 h-4 mr-1" />
                Send All Bills
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full md:w-auto">
              <Button
                onClick={() => fetchOrders()}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full text-xs md:text-sm"
              >
                <RefreshCw className="w-3 h-3 md:w-4 h-4 mr-1" />
                Refresh Bills
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}