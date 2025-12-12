"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "@/context/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, Smartphone, Menu, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { API_BASE } from "@/config/api"

interface QRData {
  table_no: string
  hash: string
  url: string
}

export default function ScanPage() {
  const navigate = useNavigate()
  const { setCurrentTable, state } = useApp()

  const [selectedTable, setSelectedTable] = useState<string>("")
  const [qrData, setQrData] = useState<QRData[]>([])
  const [loadingTables, setLoadingTables] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Redirect admin users
  useEffect(() => {
    if (state.user.role === 'admin') {
      navigate('/admin')
    }
  }, [state.user.role, navigate])

  // Fetch available tables
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
          throw new Error('Failed to fetch tables')
        }
      } catch (error) {
        console.error('Error fetching tables:', error)
        setError('Unable to load tables. Please try again.')
      } finally {
        setLoadingTables(false)
      }
    }

    fetchTables()
  }, [])

  const handleTableSelection = (tableNum: string) => {
    setSelectedTable(tableNum)
    setError(null)
  }

  const handleConfirmTable = async () => {
    if (!selectedTable) {
      setError('Please select a table first')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Verify table exists
      if (!qrData.some(qr => qr.table_no === selectedTable)) {
        throw new Error('Invalid table number')
      }

      // Set the table in context
      setCurrentTable(selectedTable)
      
      // Show success message
      setSuccessMessage(`Table ${selectedTable} confirmed. Redirecting to menu...`)
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/menu')
      }, 1500)
      
    } catch (error: any) {
      setError(error.message || 'Failed to select table')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetSelection = () => {
    setSelectedTable("")
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Table className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Select Your Table</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose your table number to start ordering from our digital menu
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {successMessage && (
            <div className="max-w-md mx-auto mb-6">
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-sm text-emerald-700">
                  {successMessage}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Table Selection */}
        <div className="max-w-2xl mx-auto">
          <Card className="border border-gray-200 mb-6">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Table className="w-5 h-5" />
                Available Tables
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  Please select your table number from the list below
                </p>
                {selectedTable && (
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    Selected: <span className="text-blue-600">Table {selectedTable}</span>
                  </p>
                )}
              </div>
              
              {loadingTables ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading available tables...</p>
                </div>
              ) : qrData.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                    {qrData.map((qr) => (
                      <Button
                        key={qr.table_no}
                        variant="outline"
                        className={`h-20 border-gray-300 hover:bg-gray-50 transition-colors ${
                          selectedTable === qr.table_no 
                            ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900' 
                            : ''
                        }`}
                        onClick={() => handleTableSelection(qr.table_no)}
                        disabled={isProcessing}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Table className="w-5 h-5" />
                          <span className="font-semibold text-lg">Table {qr.table_no}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {selectedTable && (
                      <Button
                        onClick={handleConfirmTable}
                        disabled={isProcessing}
                        className="bg-gray-900 hover:bg-gray-800 text-white flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Table {selectedTable}
                          </>
                        )}
                      </Button>
                    )}
                    
                    {selectedTable && (
                      <Button
                        onClick={resetSelection}
                        variant="outline"
                        className="border-gray-300 flex-1"
                        disabled={isProcessing}
                      >
                        Change Table
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Table className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tables Available</h3>
                  <p className="text-gray-500">
                    All tables are currently occupied or unavailable. Please wait for staff assistance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold">How Digital Ordering Works</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-900 font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Select Your Table</h4>
                    <p className="text-sm text-gray-600">
                      Choose your table number from the available options. This helps us serve your order correctly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-900 font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Browse Our Menu</h4>
                    <p className="text-sm text-gray-600">
                      Explore our complete menu with prices, descriptions, and images. Take your time to choose.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-900 font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Add Items to Cart</h4>
                    <p className="text-sm text-gray-600">
                      Select items, customize with special instructions, and add them to your cart.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-900 font-semibold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Place Your Order</h4>
                    <p className="text-sm text-gray-600">
                      Review your order, provide contact details, and submit. Your food will be prepared fresh.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-900 font-semibold">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Track & Enjoy</h4>
                    <p className="text-sm text-gray-600">
                      Watch your order progress in real-time. We'll serve it directly to your table.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Smartphone className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 mb-1">Mobile Friendly</h4>
                    <p className="text-xs text-gray-600">Optimized for all devices</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Table className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 mb-1">Table Service</h4>
                    <p className="text-xs text-gray-600">Direct to your table</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Menu className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900 mb-1">Digital Menu</h4>
                    <p className="text-xs text-gray-600">Always up-to-date</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">Need assistance?</p>
            <p className="text-sm text-gray-600">Please ask our restaurant staff for help</p>
          </div>
        </div>
      </div>
    </div>
  )
}