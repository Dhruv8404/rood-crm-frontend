import { useParams, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { API_BASE } from "@/config/api"

export default function ScanPage() {
  const { table_no, hash } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!table_no || !hash) return

    // OPTIONAL: verify table with backend
    fetch(`${API_BASE}tables/verify/${table_no}/${hash}/`)
      .then(res => {
        if (!res.ok) throw new Error("Invalid QR")
        return res.json()
      })
      .then(() => {
        localStorage.setItem("table_no", table_no)
        navigate("/menu")
      })
      .catch(() => {
        alert("Invalid or expired QR code")
      })
  }, [table_no, hash])

  return <p className="text-center mt-20">Scanning QR…</p>
}
