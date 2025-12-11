"use client"
import { API_BASE } from "@/config/api"
import { useState, useRef, useEffect, useCallback } from "react"
import QRCode from "react-qr-code"
import html2canvas from "html2canvas"
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
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  QrCode,
  Download,
  Trash2,
  Edit,
  TestTube,
  Plus,
  Sparkles,
  Hash,
  Table as TableIcon,
  Link as LinkIcon,
  RefreshCw,
  Check,
  X,
  Scan,
  AlertCircle,
  Loader2
} from "lucide-react"

interface QRData {
  table_no: string
  hash: string
  url: string
}

interface ApiResponse {
  success: boolean
  data?: QRData[]
  error?: string
}

export default function AdminQR() {
  const { state, logout } = useApp()

  // State management
  const [qrData, setQrData] = useState<QRData[]>([])
  const [generating, setGenerating] = useState(false)
  const [rangeInput, setRangeInput] = useState('1')
  const [editingTable, setEditingTable] = useState<string | null>(null)
  const [editTableNo, setEditTableNo] = useState('')
  const [downloading, setDownloading] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [selectedTables, setSelectedTables] = useState<Set<number>>(new Set())
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Refs
  const qrRefs = useRef<(HTMLDivElement | null)[]>([])

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Check authentication
  const checkAuth = useCallback(() => {
    if (!state.user || state.user.role !== 'admin' || !state.token) {
      showNotification('error', 'Please log in as admin first.')
      return false
    }
    return true
  }, [state.user, state.token, showNotification])

  // Initialize QR codes on component mount and when user logs in/out
  useEffect(() => {
    if (state.user && state.user.role === 'admin' && state.token) {
      fetchAllQRCodes()
    } else if (state.user && (state.user.role !== 'admin' || !state.token)) {
      // Clear QR data when user is not admin or has no token
      setQrData([])
      setSelectedTables(new Set())
      setSelectAll(false)
    }
    // If state.user is null (loading), do nothing - wait for user data to load
  }, [state.token, state.user])

  // Fetch all QR codes
  const fetchAllQRCodes = useCallback(async () => {
    if (!checkAuth()) return

    setLoading(true)
    try {
      const response = await fetch(API_BASE + 'tables/', {

        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      })

      if (response.ok) {
        const data: QRData[] = await response.json()
        setQrData(data)
      } else if (response.status === 401 || response.status === 403) {
        // Token expired or invalid, logout user
        logout()
        showNotification('error', 'Session expired. Please log in again.')
      } else {
        showNotification('error', 'Failed to fetch QR codes')
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error)
      showNotification('error', 'Error fetching QR codes')
    } finally {
      setLoading(false)
    }
  }, [checkAuth, state.token, showNotification])

  // Generate QR codes
  const generateQR = useCallback(async () => {
    if (!checkAuth()) return

    setGenerating(true)
    try {
      const body = { range: rangeInput.trim() || '1' }
      const response = await fetch(API_BASE + 'tables/generate/', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data: QRData[] = await response.json()
        setQrData(prev => [...prev, ...data])
        setRangeInput('1')
        showNotification('success', `Generated ${data.length} QR code(s) successfully`)
      } else if (response.status === 401 || response.status === 403) {
        showNotification('error', 'Session expired. Please log in again.')
      } else {
        const error = await response.json()
        showNotification('error', error.error || 'Failed to generate QR codes')
      }
    } catch (error) {
      console.error('Error generating QR codes:', error)
      showNotification('error', 'Error generating QR codes')
    } finally {
      setGenerating(false)
    }
  }, [checkAuth, rangeInput, state.token, showNotification])

  // Download single QR code
  const downloadQR = useCallback(async (index: number) => {
    if (!qrRefs.current[index] || !qrData[index]) return

    setDownloading(index)
    try {
      const canvas = await html2canvas(qrRefs.current[index]!)
      const link = document.createElement('a')
      link.download = `table-${qrData[index].table_no}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      showNotification('success', `Downloaded QR code for table ${qrData[index].table_no}`)
    } catch (error) {
      console.error('Download failed:', error)
      showNotification('error', 'Failed to download QR code')
    } finally {
      setDownloading(null)
    }
  }, [qrData, showNotification])

  // Download all QR codes
  const downloadAllQR = useCallback(async () => {
    if (qrData.length === 0) {
      showNotification('error', 'No QR codes to download')
      return
    }

    for (let i = 0; i < qrData.length; i++) {
      await downloadQR(i)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
    }
    showNotification('success', `Downloaded all ${qrData.length} QR codes`)
  }, [qrData.length, downloadQR, showNotification])

  // Delete single table
  const deleteTable = useCallback(async (table_no: string, index: number) => {
    if (!confirm(`Are you sure you want to delete table ${table_no}? This action cannot be undone.`)) return

    try {
      const response = await fetch(API_BASE + `tables/${table_no}/delete/`, {

        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      })

      if (response.ok) {
        setQrData(prev => prev.filter((_, i) => i !== index))
        showNotification('success', `Table ${table_no} deleted successfully`)
      } else {
        showNotification('error', 'Failed to delete table')
      }
    } catch (error) {
      console.error('Error deleting table:', error)
      showNotification('error', 'Error deleting table')
    }
  }, [state.token, showNotification])

  // Handle table editing
  const handleEditTable = useCallback((table_no: string) => {
    setEditingTable(table_no)
    setEditTableNo(table_no)
  }, [])

  // Save edited table
  const saveEditTable = useCallback(async () => {
    if (!editingTable || !state.token) return

    try {
      const response = await fetch(API_BASE + `tables/${editingTable}/edit/`, {

        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ new_table_no: editTableNo }),
      })

      if (response.ok) {
        setQrData(prev => prev.map(qr =>
          qr.table_no === editingTable ? { ...qr, table_no: editTableNo } : qr
        ))
        setEditingTable(null)
        setEditTableNo('')
        showNotification('success', `Table ${editingTable} renamed to ${editTableNo}`)
      } else {
        showNotification('error', 'Failed to edit table')
      }
    } catch (error) {
      console.error('Error editing table:', error)
      showNotification('error', 'Error editing table')
    }
  }, [editingTable, editTableNo, state.token, showNotification])

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedTables(new Set())
    } else {
      setSelectedTables(new Set(qrData.map((_, index) => index)))
    }
    setSelectAll(!selectAll)
  }, [selectAll, qrData])

  // Handle individual table selection
  const handleSelectTable = useCallback((index: number) => {
    const newSelected = new Set(selectedTables)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTables(newSelected)
    setSelectAll(newSelected.size === qrData.length)
  }, [selectedTables, qrData.length])

  // Delete selected tables
  const deleteSelectedTables = useCallback(async () => {
    if (selectedTables.size === 0) {
      showNotification('error', 'Please select tables to delete.')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedTables.size} selected table(s)? This action cannot be undone.`)) return

    try {
      const deletePromises = Array.from(selectedTables).map(index => {
        const table_no = qrData[index].table_no
        return fetch(API_BASE + `tables/${table_no}/delete/`, {

          headers: {
            'Authorization': `Bearer ${state.token}`,
          },
        })
      })

      const results = await Promise.all(deletePromises)
      const failed = results.filter(res => !res.ok).length

      if (failed === 0) {
        setQrData(prev => prev.filter((_, index) => !selectedTables.has(index)))
        setSelectedTables(new Set())
        setSelectAll(false)
        showNotification('success', `Deleted ${selectedTables.size} table(s) successfully`)
      } else {
        showNotification('error', `Failed to delete ${failed} table(s)`)
      }
    } catch (error) {
      console.error('Error deleting tables:', error)
      showNotification('error', 'Error deleting tables')
    }
  }, [selectedTables, qrData, state.token, showNotification])

  // Delete all tables
  const deleteAllTables = useCallback(async () => {
    if (qrData.length === 0) {
      showNotification('error', 'No tables to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ALL ${qrData.length} tables? This action cannot be undone.`)) return

    try {
      const deletePromises = qrData.map(qr =>
       fetch(API_BASE + `tables/${qr.table_no}/delete/`, {

          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${state.token}`,
          },
        })
      )

      const results = await Promise.all(deletePromises)
      const failed = results.filter(res => !res.ok).length

      if (failed === 0) {
        setQrData([])
        setSelectedTables(new Set())
        setSelectAll(false)
        showNotification('success', `Deleted all ${qrData.length} tables successfully`)
      } else {
        showNotification('error', `Failed to delete ${failed} table(s)`)
      }
    } catch (error) {
      console.error('Error deleting all tables:', error)
      showNotification('error', 'Error deleting all tables')
    }
  }, [qrData, state.token, showNotification])

  // Generate fresh QR codes for tables 1-10
  const generateFreshQRCodes = useCallback(async () => {
    if (!checkAuth()) return

    setGenerating(true)
    try {
      const response = await fetch(API_BASE + 'tables/generate/', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({ range: '1-10' }),
      })

      if (response.ok) {
        const data: QRData[] = await response.json()
        setQrData(data)
        showNotification('success', `Generated ${data.length} fresh QR codes for tables 1-10`)
      } else if (response.status === 401 || response.status === 403) {
        showNotification('error', 'Session expired. Please log in again.')
      } else {
        showNotification('error', 'Failed to generate fresh QR codes')
      }
    } catch (error) {
      console.error('Error generating fresh QR codes:', error)
      showNotification('error', 'Error generating fresh QR codes')
    } finally {
      setGenerating(false)
    }
  }, [checkAuth, state.token, showNotification])

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-purple-200 mb-4">
            <QrCode className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              QR Code Management
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate and manage table QR codes for your restaurant
          </p>
        </motion.div>

        {/* Generation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Plus className="w-6 h-6" />
                Generate Table QR Codes
              </CardTitle>
              <CardDescription className="text-blue-100">
                Create QR codes for tables or table ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <TableIcon className="w-4 h-4" />
                      Table Range
                    </label>
                    <Input
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="Examples: T1, T1-T5, 3 (for next 3 tables)"
                      className="h-12 border-2 border-gray-200 bg-white/50 rounded-xl focus:border-blue-500 transition-colors"
                    />
                    <p className="text-sm text-gray-500">
                      Enter table number, range (T1-T5), or count (3) for multiple tables
                    </p>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={generateQR}
                      disabled={generating || !rangeInput.trim()}
                      className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-0 font-semibold rounded-xl"
                      size="lg"
                    >
                      {generating ? (
                        <div className="flex items-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Generating QR Codes...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <QrCode className="w-5 h-5 mr-2" />
                          Generate QR Codes
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  {/* Show Total Generated QR Codes */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">Total QR Codes Generated</span>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 text-lg px-3 py-1">
                        {qrData.length}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {qrData.length === 0 ? 'No QR codes generated yet' : `${qrData.length} QR code${qrData.length === 1 ? '' : 's'} ready for use`}
                    </p>
                  </div>

                  {/* View All Scanners Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => {
                        fetchAllQRCodes()
                        // Scroll to All Scanners section
                        setTimeout(() => {
                          const scannersSection = document.getElementById('all-scanners-section')
                          if (scannersSection) {
                            scannersSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }, 500)
                      }}
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg border-0 font-semibold rounded-xl"
                      size="lg"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Loading Scanners...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Scan className="w-5 h-5 mr-2" />
                          View All Scanners
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Quick Examples
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span><strong>T1</strong> - Single table</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span><strong>T1-T5</strong> - Table range</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span><strong>3</strong> - Next 3 tables</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span><strong>T1,T3,T5</strong> - Specific tables</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* QR Codes Table */}
        <AnimatePresence>
          {qrData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <QrCode className="w-6 h-6" />
                      Generated QR Codes
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {qrData.length} tables
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={downloadAllQR}
                          variant="outline"
                          className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download All
                        </Button>
                      </motion.div>
                      {selectedTables.size > 0 && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={deleteSelectedTables}
                            variant="destructive"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white border-0"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedTables.size})
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold text-gray-700">Table Number</TableHead>
                          <TableHead className="font-semibold text-gray-700">Hash ID</TableHead>
                          <TableHead className="font-semibold text-gray-700">QR Code URL</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">QR Code</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {qrData.map((qr, index) => (
                            <motion.tr
                              key={qr.hash}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.1 }}
                              className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
                            >
                              <TableCell>
                                {editingTable === qr.table_no ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editTableNo}
                                      onChange={(e) => setEditTableNo(e.target.value)}
                                      placeholder="New table number"
                                      className="h-8 w-24"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <TableIcon className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-gray-900">{qr.table_no}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-gray-500" />
                                  <span className="font-mono text-sm text-gray-600 truncate max-w-[120px]">
                                    {qr.hash}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <LinkIcon className="w-4 h-4 text-gray-500" />
                                  <span
                                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-[200px]"
                                    onClick={() => window.open(qr.url, '_blank')}
                                  >
                                    {qr.url}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div
                                  ref={(el) => { qrRefs.current[index] = el }}
                                  className="flex justify-center p-2 bg-white rounded-lg border border-gray-200"
                                >
                                  {qr.url ? (
                                    <QRCode
                                      value={qr.url}
                                      size={80}
                                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-lg">
                                      <AlertCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2 justify-end">
                                  {editingTable === qr.table_no ? (
                                    <>
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                          size="sm"
                                          onClick={saveEditTable}
                                          className="bg-green-500 hover:bg-green-600 text-white border-0"
                                        >
                                          <Check className="w-4 h-4" />
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingTable(null)}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </motion.div>
                                    </>
                                  ) : (
                                    <>
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(qr.url, '_blank')}
                                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                        >
                                          <TestTube className="w-4 h-4 mr-1" />
                                          Test
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => downloadQR(index)}
                                          disabled={downloading === index}
                                          className="border-green-200 text-green-700 hover:bg-green-50"
                                        >
                                          {downloading === index ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Download className="w-4 h-4 mr-1" />
                                          )}
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditTable(qr.table_no)}
                                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                        >
                                          <Edit className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => deleteTable(qr.table_no, index)}
                                          className="border-0"
                                        >
                                          <Trash2 className="w-4 h-4 mr-1" />
                                          Delete
                                        </Button>
                                      </motion.div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={selectedTables.has(index)}
                                  onCheckedChange={() => handleSelectTable(index)}
                                />
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All Scanners View */}
        <motion.div
          id="all-scanners-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Scan className="w-6 h-6" />
                All Scanners ({qrData.length})
              </CardTitle>
              <CardDescription className="text-green-100">
                Complete view of all generated QR code scanners
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {qrData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {qrData.map((qr, index) => (
                    <motion.div
                      key={qr.hash}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="text-center space-y-4">
                        {/* Table Header */}
                        <div className="flex items-center justify-center gap-2">
                          <TableIcon className="w-6 h-6 text-green-600" />
                          <span className="font-bold text-xl text-gray-900">Table {qr.table_no}</span>
                        </div>

                        {/* QR Code Display */}
                        <div className="flex justify-center p-3 bg-white rounded-xl border-2 border-gray-100 shadow-inner">
                          {qr.url && typeof qr.url === 'string' && qr.url.trim().length > 0 ? (
                            <QRCode
                              value={qr.url}
                              size={120}
                              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-30 h-30 bg-gray-100 rounded-lg">
                              <AlertCircle className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Hash ID */}
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 rounded-lg px-2 py-1 truncate">
                          {qr.hash}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(qr.url, '_blank')}
                            className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <TestTube className="w-3 h-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQR(index)}
                            disabled={downloading === index}
                            className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            {downloading === index ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3 mr-1" />
                            )}
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTable(qr.table_no)}
                            className="h-8 px-3 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTable(qr.table_no, index)}
                            className="h-8 px-3 text-xs border-0"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Scan className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Scanners Available</h3>
                  <p className="text-gray-500">Generate QR codes to view all scanners here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Empty State */}
        <AnimatePresence>
          {qrData.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-3">No QR Codes Generated</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Generate your first table QR code to get started. QR codes will allow customers to access your menu directly from their tables.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
