"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scan, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { API_BASE } from "@/config/api"

interface VerificationResult {
  valid: boolean
  table_no?: string
  error?: string
}

interface QRData {
  table_no: string
  hash: string
  url: string
}

export default function ScanPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { setCurrentTable, state } = useApp()

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [qrData, setQrData] = useState<QRData[]>([])
  const [loadingTables, setLoadingTables] = useState(true)

  // Redirect admin users
  useEffect(() => {
    if (state.user.role === 'admin') {
      navigate('/admin')
    }
  }, [state.user.role, navigate])

  // Fetch available tables from admin QR codes
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch(`${API_BASE}tables/`, {

          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data: QRData[] = await response.json()
          setQrData(data)
        } else {
          console.error('Failed to fetch tables')
        }
      } catch (error) {
        console.error('Error fetching tables:', error)
      } finally {
        setLoadingTables(false)
      }
    }

    fetchTables()
  }, [])

  // Handle QR code scanning or direct table access
  useEffect(() => {
    const table = params.table
    const hash = params.hash

    if (table && hash) {
      // QR code scanning - verify with backend
      handleQRVerification(table, hash)
    } else if (table && !hash) {
      // Direct table selection from URL
      handleDirectTableSelection(table)
    }
  }, [params.table, params.hash])

  const handleQRVerification = async (table: string, hash: string) => {
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      const response = await fetch(`${API_BASE}tables/verify/?table=${table}&hash=${hash}`, {

        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setVerificationResult({ valid: true, table_no: data.table_no })
        setCurrentTable(data.table_no)
        setTimeout(() => {
          navigate('/menu')
        }, 2000)
      } else {
        setVerificationResult({
          valid: false,
          error: data.error || 'Invalid QR code. Please scan a valid table QR code.'
        })
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setVerificationResult({
        valid: false,
        error: 'Unable to verify QR code. Please check your connection and try again.'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDirectTableSelection = (table: string) => {
    setCurrentTable(table)
    setVerificationResult({ valid: true, table_no: table })
    setTimeout(() => {
      navigate('/menu')
    }, 1500)
  }

  const handleManualTableSelection = (tableNum: string) => {
    setSelectedTable(tableNum)
    setCurrentTable(tableNum)
    setVerificationResult({ valid: true, table_no: tableNum })
    setTimeout(() => {
      navigate('/menu')
    }, 1500)
  }

  const resetVerification = () => {
    setVerificationResult(null)
    setIsVerifying(false)
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-2xl border-4 border-white/20"
          >
            <Scan className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Scan Table QR Code
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scan the QR code on your table to start ordering delicious food
          </p>
        </motion.div>

        {/* Verification Status */}
        {(isVerifying || verificationResult) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {isVerifying ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying QR Code</h3>
                    <p className="text-gray-600">Please wait while we verify your table...</p>
                  </div>
                ) : verificationResult ? (
                  <Alert className={verificationResult.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {verificationResult.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className="text-sm">
                      {verificationResult.valid
                        ? `Welcome! Your table number is ${verificationResult.table_no}. Redirecting to menu...`
                        : verificationResult.error
                      }
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Manual Table Selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-100">
            <CardHeader>
              <CardTitle className="text-center text-xl font-semibold text-gray-900">
                Select Your Table
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-6">
                  Choose your table number to begin ordering
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {loadingTables ? (
                    <div className="col-span-3 text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                      <p className="text-gray-600">Loading available tables...</p>
                    </div>
                  ) : qrData.length > 0 ? (
                    qrData.map((qr) => (
                      <Button
                        key={qr.table_no}
                        variant="outline"
                        size="lg"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 h-16 text-lg font-semibold disabled:opacity-50"
                        onClick={() => handleManualTableSelection(qr.table_no)}
                        disabled={isVerifying || (verificationResult?.valid && verificationResult.table_no !== qr.table_no)}
                      >
                        Table {qr.table_no}
                      </Button>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-8">
                      <p className="text-gray-600">No tables available. Please contact restaurant staff.</p>
                    </div>
                  )}
                </div>
                {(verificationResult || isVerifying) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetVerification}
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 w-full"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">How to Use</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">1</span>
                  </div>
                  <p>Scan the QR code displayed on your table using your phone's camera</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">2</span>
                  </div>
                  <p>You'll be automatically redirected to the menu page</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">3</span>
                  </div>
                  <p>Browse items, add to cart, and place your order</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
