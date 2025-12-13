"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { API_BASE } from "@/config/api"
import { useApp } from "@/context/app-context"

export default function ScanPage() {
  const { table_no, hash } = useParams()
  const router = useRouter()
  const { setCurrentTable } = useApp()

  useEffect(() => {
    if (!table_no || !hash) return

    const verifyTable = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/tables/verify/${table_no}/${hash}/`
        )

        const data = await res.json()

        if (!res.ok || !data.valid) {
          router.replace("/invalid-qr")
          return
        }

        // ✅ AUTO SELECT TABLE
        setCurrentTable(table_no as string)

        // ✅ REDIRECT TO MENU
        router.replace("/menu")
      } catch (err) {
        router.replace("/invalid-qr")
      }
    }

    verifyTable()
  }, [table_no, hash])

  return <p className="text-center mt-20">Scanning QR…</p>
}
