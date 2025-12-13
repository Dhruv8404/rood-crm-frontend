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
  Loader2,
  ChevronLeft,
  Grid
} from "lucide-react"

interface QRData {
  table_no: string
  hash: string
  scan_url: string  // new field
  qr_code_url?: string
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
      const response = await fetch(`${API_BASE}tables/`, {
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
  if (!checkAuth()) return;

  setGenerating(true);

  try {
    const value = rangeInput.trim();

    if (!value) {
      showNotification("error", "Range is required");
      setGenerating(false);
      return;
    }

    const response = await fetch(`${API_BASE}tables/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        range: value,   // ✅ THIS IS THE FIX
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification("error", data.error || "Failed to generate QR");
      return;
    }

    setQrData((prev) => [...prev, ...data]);
    setRangeInput("");
    showNotification("success", `Generated ${data.length} QR code(s)`);

  } catch (error) {
    console.error(error);
    showNotification("error", "QR generation failed");
  } finally {
    setGenerating(false);
  }
}, [rangeInput, state.token, checkAuth, showNotification]);

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
      const response = await fetch(`${API_BASE}tables/${table_no}/delete/`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${state.token}` }
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
      const response = await fetch(`${API_BASE}tables/${editingTable}/edit/`, {
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

  if (
    !confirm(
      `Are you sure you want to delete ${selectedTables.size} selected table(s)?`
    )
  )
    return

  try {
    const deletePromises = Array.from(selectedTables).map((index) => {
      const table_no = qrData[index].table_no
      return fetch(`${API_BASE}tables/${table_no}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      })
    })

    const results = await Promise.all(deletePromises)
    const failed = results.filter((res) => !res.ok).length

    if (failed === 0) {
      setQrData((prev) =>
        prev.filter((_, index) => !selectedTables.has(index))
      )
      setSelectedTables(new Set())
      setSelectAll(false)
      showNotification('success', 'Selected tables deleted successfully')
    } else {
      showNotification('error', `${failed} table(s) failed to delete`)
    }
  } catch (error) {
    console.error(error)
    showNotification('error', 'Error deleting tables')
  }
}, [selectedTables, qrData, state.token, showNotification])

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
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border border-gray-300 bg-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Back</span>
                </Button>
              </motion.div>
              <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="rounded-lg md:rounded-xl bg-white p-2 md:p-3 shadow border border-gray-200">
                    <QrCode className="h-5 w-5 md:h-8 md:w-8 text-gray-700" />
                  </div>
                  <h1 className="text-xl md:text-4xl font-bold text-gray-900">
                    QR Code Management
                  </h1>
                </div>
                <p className="text-sm md:text-xl text-gray-600 mt-1 md:mt-2">
                  Generate and manage table QR codes for your restaurant
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <Alert className={`border ${
                notification.type === 'success' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <AlertDescription className={
                  notification.type === 'success' ? 'text-green-700' : 'text-red-700'
                }>
                  {notification.message}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardHeader className="bg-gray-800 text-white p-3 md:p-6">
              <CardTitle className="text-lg md:text-2xl flex items-center gap-2 md:gap-3">
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
                Generate Table QR Codes
              </CardTitle>
              <CardDescription className="text-gray-200 text-sm md:text-base">
                Create QR codes for tables or table ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <TableIcon className="w-4 h-4" />
                      Table Range
                    </label>
                    <Input
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="Examples: T1, T1-T5, 3 (for next 3 tables)"
                      className="h-11 md:h-12 border border-gray-300 bg-white rounded-lg focus:border-gray-500 transition-colors"
                    />
                    <p className="text-xs md:text-sm text-gray-500">
                      Enter table number, range (T1-T5), or count (3) for multiple tables
                    </p>
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={generateQR}
                      disabled={generating || !rangeInput.trim()}
                      className="w-full h-11 md:h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg"
                    >
                      {generating ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Generating QR Codes...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <QrCode className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Generate QR Codes
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  {/* Show Total Generated QR Codes */}
                  <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                        <span className="font-medium text-gray-900 text-sm md:text-base">Total QR Codes Generated</span>
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800 border border-gray-300 text-sm md:text-lg px-2 md:px-3 py-1">
                        {qrData.length}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                      {qrData.length === 0 ? 'No QR codes generated yet' : `${qrData.length} QR code${qrData.length === 1 ? '' : 's'} ready for use`}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg md:rounded-xl p-3 md:p-6 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                    Quick Examples
                  </h3>
                  <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-500 rounded-full"></div>
                      <span><strong>T1</strong> - Single table</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-500 rounded-full"></div>
                      <span><strong>T1-T5</strong> - Table range</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-500 rounded-full"></div>
                      <span><strong>3</strong> - Next 3 tables</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-2 md:h-2 bg-gray-500 rounded-full"></div>
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
              id="all-scanners-section"
            >
              <Card className="border border-gray-200 shadow-lg bg-white">
                <CardHeader className="bg-gray-800 text-white p-3 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <CardTitle className="text-lg md:text-2xl flex items-center gap-2 md:gap-3">
                      <QrCode className="w-5 h-5 md:w-6 md:h-6" />
                      Generated QR Codes
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs md:text-sm">
                        {qrData.length} tables
                      </Badge>
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={downloadAllQR}
                          variant="outline"
                          className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-xs md:text-sm"
                          size="sm"
                        >
                          <Download className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Download All
                        </Button>
                      </motion.div>
                      {selectedTables.size > 0 && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={deleteSelectedTables}
                            variant="destructive"
                            size="sm"
                            className="bg-gray-700 hover:bg-gray-800 text-white border-0 text-xs md:text-sm"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
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
                          <TableHead className="font-medium text-gray-700 text-xs md:text-sm">Table</TableHead>
                          <TableHead className="font-medium text-gray-700 text-xs md:text-sm hidden md:table-cell">Hash ID</TableHead>
                          <TableHead className="font-medium text-gray-700 text-xs md:text-sm hidden lg:table-cell">URL</TableHead>
                          <TableHead className="font-medium text-gray-700 text-xs md:text-sm text-center">QR Code</TableHead>
                          <TableHead className="font-medium text-gray-700 text-xs md:text-sm text-right">Actions</TableHead>
                          <TableHead className="font-medium text-gray-700 text-xs md:text-sm text-center">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={handleSelectAll}
                              className="h-4 w-4"
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
                              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="py-2 md:py-4">
                                {editingTable === qr.table_no ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editTableNo}
                                      onChange={(e) => setEditTableNo(e.target.value)}
                                      placeholder="New table number"
                                      className="h-8 w-20 md:w-24 text-sm"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <TableIcon className="w-4 h-4 text-gray-600" />
                                    <span className="font-medium text-gray-900 text-sm">{qr.table_no}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="py-2 md:py-4 hidden md:table-cell">
                                <div className="flex items-center gap-2">
                                  <Hash className="w-3 h-3 md:w-4 h-4 text-gray-500" />
                                  <span className="font-mono text-xs text-gray-600 truncate max-w-[100px] md:max-w-[120px]">
                                    {qr.hash}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 md:py-4 hidden lg:table-cell">
                                <div className="flex items-center gap-2">
                                  <LinkIcon className="w-3 h-3 md:w-4 h-4 text-gray-500" />
                                  <span
                                    className="text-xs text-gray-600 hover:text-gray-800 cursor-pointer truncate max-w-[150px]"
                                    onClick={() => window.open(qr.scan_url, '_blank')}

                                    title={qr.url}
                                  >
                                    {qr.url}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 md:py-4">
                                <div
                                  ref={(el) => { qrRefs.current[index] = el }}
                                  className="flex justify-center p-1 md:p-2 bg-white rounded border border-gray-200"
                                >
                                  {qr.url ? (
                                    <QRCode
                                      value={qr.url}
                                      size={60}
                                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center w-15 h-15 md:w-20 md:h-20 bg-gray-100 rounded">
                                      <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 md:py-4">
                                <div className="flex flex-col md:flex-row gap-1 md:gap-2 justify-end">
                                  {editingTable === qr.table_no ? (
                                    <>
                                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                          size="sm"
                                          onClick={saveEditTable}
                                          className="bg-gray-800 hover:bg-gray-900 text-white border-0 text-xs"
                                        >
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setEditingTable(null)}
                                          className="border-gray-300 text-gray-700 text-xs"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </motion.div>
                                    </>
                                  ) : (
                                    <>
                                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(qr.url, '_blank')}
                                          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                                        >
                                          <Scan className="w-3 h-3" />
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => downloadQR(index)}
                                          disabled={downloading === index}
                                          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                                        >
                                          {downloading === index ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Download className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditTable(qr.table_no)}
                                          className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      </motion.div>
                                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => deleteTable(qr.table_no, index)}
                                          className="border-0 text-xs bg-gray-700 hover:bg-gray-800"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </motion.div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2 md:py-4 text-center">
                                <Checkbox
                                  checked={selectedTables.has(index)}
                                  onCheckedChange={() => handleSelectTable(index)}
                                  className="h-4 w-4"
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

        {/* All Scanners Grid View */}
        {qrData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border border-gray-200 shadow-lg bg-white">
              <CardHeader className="bg-gray-800 text-white p-3 md:p-6">
                <CardTitle className="text-lg md:text-2xl flex items-center gap-2 md:gap-3">
                  <Grid className="w-5 h-5 md:w-6 md:h-6" />
                  All Scanners ({qrData.length})
                </CardTitle>
                <CardDescription className="text-gray-200 text-sm md:text-base">
                  Complete view of all generated QR code scanners
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                  {qrData.map((qr, index) => (
                    <motion.div
                      key={qr.hash}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-lg md:rounded-xl p-3 md:p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="text-center space-y-2 md:space-y-4">
                        {/* Table Header */}
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <TableIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-600" />
                          <span className="font-bold text-sm md:text-xl text-gray-900">Table {qr.table_no}</span>
                        </div>

                        {/* QR Code Display */}
                        <div className="flex justify-center p-2 md:p-3 bg-white rounded-lg border border-gray-100">
                          {qr.url ? (
                            <QRCode
                              value={qr.url}
                              size={80}
                              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded">
                              <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Hash ID */}
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 rounded px-1 md:px-2 py-1 truncate text-[10px] md:text-xs">
                          {qr.hash.substring(0, 12)}...
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-1 md:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(qr.url, '_blank')}
                            className="h-7 md:h-8 px-2 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                          >
                            <Scan className="w-3 h-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQR(index)}
                            disabled={downloading === index}
                            className="h-7 md:h-8 px-2 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                          >
                            {downloading === index ? (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Download className="w-3 h-3 mr-1" />
                            )}
                            Download
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        <AnimatePresence>
          {qrData.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8 md:py-16"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <QrCode className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-2xl font-semibold text-gray-600 mb-2 md:mb-3">No QR Codes Generated</h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm md:text-base mb-6">
                Generate your first table QR code to get started. QR codes will allow customers to access your menu directly from their tables.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}