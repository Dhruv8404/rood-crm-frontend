"use client"

import { Navigate, useLocation } from "react-router-dom"
import { useApp } from "@/context/app-context"
import type React from "react"

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles: Array<"customer" | "chef" | "admin">
}) {
  const { state } = useApp()
  const location = useLocation()

  if (!roles.includes(state.user.role as any)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
