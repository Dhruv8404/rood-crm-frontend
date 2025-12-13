import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { API_BASE } from "@/config/api"
import { useApp } from "@/context/app-context"

export default function ScanPage() {
  const { table_no, hash } = useParams()
  const navigate = useNavigate()
  const { setCurrentTable } = useApp()

  useEffect(() => {
    if (!table_no || !hash) return

    fetch(`${API_BASE}/api/tables/verify/${table_no}/${hash}/`)
      .then(res => res.json())
      .then(data => {
        if (!data.valid) {
          navigate("/invalid-qr")
          return
        }

        setCurrentTable(table_no)
        navigate("/menu")
      })
      .catch(() => navigate("/invalid-qr"))
  }, [])

  return <p>Scanning QR…</p>
}
