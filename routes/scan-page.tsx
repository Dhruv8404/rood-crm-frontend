"use client"

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useApp } from "@/context/app-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, Loader2, AlertCircle } from "lucide-react"
import { API_BASE } from "@/config/api"

export default function ScanPage() {
  const navigate = useNavigate()
  const { tableNo, hash } = useParams()
  const { setCurrentTable, state } = useApp()

  const [error, setError] = useState<string | null>(null)

  // 🚫 Redirect admin
  useEffect(() => {
    if (state.user.role === "admin") {
      navigate("/admin")
    }
  }, [state.user.role, navigate])

  // ✅ AUTO SELECT TABLE FROM QR
  useEffect(() => {
    const verifyAndSetTable = async () => {
      if (!tableNo || !hash) {
        setError("Invalid QR Code")
        return
      }

      try {
        const res = await fetch(
          `${API_BASE}tables/verify/${tableNo}/${hash}/`
        )

        if (!res.ok) throw new Error("Invalid or expired QR")

        const data = await res.json()

        if (data.valid) {
          setCurrentTable(data.table_no)

          // 🚀 go directly to menu
          navigate("/menu", { replace: true })
        } else {
          setError("Invalid table QR")
        }
      } catch (err) {
        setError("Failed to verify QR code")
      }
    }

    verifyAndSetTable()
  }, [tableNo, hash, navigate, setCurrentTable])

  // ⏳ Loading / Error UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {error ? (
        <div className="max-w-md w-full px-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
            <Table className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-700" />
          <p className="text-gray-600">
            Verifying table & opening menu…
          </p>
        </div>
      )}
    </div>
  )
}
