"use client"

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppProvider, useApp } from "@/context/app-context"
import Navbar from "@/components/navbar"
import ScanPage from "@/routes/scan-page"
import MenuPage from "@/routes/menu-page"
import CartPage from "@/routes/cart-page"
import AuthPage from "@/routes/auth-page"
import OrderSuccessPage from "@/routes/order-success"
import UserDetailsPage from "@/routes/user-details"
import CustomerDashboard from "@/routes/customer-dashboard"
import ChefDashboard from "@/routes/chef-dashboard"
import ChefHistory from "@/routes/chef-history"
import AdminDashboard from "@/routes/admin-dashboard"
import AdminMenu from "@/routes/admin-menu"
import AdminQR from "@/routes/admin-qr"
import AdminOrders from "@/routes/admin-orders"
import AdminPrepare from "@/routes/admin-prepare"
import AdminKitchen from "@/routes/admin-kitchen"
import BillingPage from "@/routes/billing-page"
import LoginPage from "@/routes/login-page"
import ProtectedRoute from "@/components/protected-route"

function AppContentInner() {
  const { state } = useApp()
  return (
    <BrowserRouter>
        <div className="min-h-dvh bg-background text-foreground">
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/" element={<ScanPage />} />
            <Route path="/scan/:table_no/:hash" element={<ScanPage />} />
            <Route path="/:hash/:table" element={<ScanPage />} />
            <Route path="/table/:table" element={<ScanPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/user-details" element={<UserDetailsPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route
              path="/customer"
              element={
                <ProtectedRoute roles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef"
              element={
                <ProtectedRoute roles={["chef"]}>
                  <ChefDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-history"
              element={
                <ProtectedRoute roles={["chef"]}>
                  <ChefHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/prepare"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminPrepare />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/qr"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminQR />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/kitchen"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminKitchen />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default function AppContent() {
  return (
    <AppProvider>
      <AppContentInner />
    </AppProvider>
  )
}
