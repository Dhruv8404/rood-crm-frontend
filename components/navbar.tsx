"use client"

import type React from "react"
import { Link, useLocation } from "react-router-dom"
import { useApp } from "@/context/app-context"
import { FaUtensils, FaShoppingCart, FaUserShield } from "react-icons/fa"

export default function Navbar() {
  const { state, logout } = useApp()
  const { pathname } = useLocation()
  const cartCount = state.cart.reduce((a, b) => a + b.qty, 0)
  const billCount = state.orders.filter((o) => o.status === "completed").length

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
    const active = pathname === to
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm transition-colors ${
          active ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/60"
        }`}
      >
        {children}
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <FaUtensils className="text-primary" />
          <span>Restan food restaurent</span>
        </Link>

        <nav className="flex gap-2">
          {state.user.role === "customer" ? (
            <>
              <NavLink to="/menu">Menu</NavLink>
              <NavLink to="/cart">Cart</NavLink>
              <NavLink to="/order-success">Order</NavLink>
            </>
          ) : (
            <>
              {state.user.role !== "admin" && state.user.role !== "chef" && <NavLink to="/">Scan</NavLink>}
              {state.user.role !== "chef" && <NavLink to="/menu">Menu</NavLink>}
              {state.user.role === "chef" && <NavLink to="/chef">Chef</NavLink>}
              {state.user.role === "chef" && <NavLink to="/chef-history">History</NavLink>}
              {state.user.role === "admin" && <NavLink to="/admin">Dashboard</NavLink>}
              {state.user.role === "admin" && <NavLink to="/admin/orders">Orders</NavLink>}
              {state.user.role === "admin" && <NavLink to="/admin/prepare">Prepare</NavLink>}
              {state.user.role === "admin" && (
                <Link to="/admin/billing" className="relative px-3 py-2 rounded-md text-sm transition-colors hover:bg-secondary/60">
                  Billing
                  {billCount > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] leading-5 text-primary-foreground">
                      {billCount}
                    </span>
                  )}
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {state.user.role !== "admin" && state.user.role !== "chef" && (
            <Link to="/cart" className="relative rounded-md px-3 py-2 hover:bg-secondary/60" aria-label="Cart">
              <FaShoppingCart />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] leading-5 text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {state.user.role === "guest" ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              <FaUserShield /> Staff
            </Link>
          ) : (
            <button
              onClick={logout}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/60"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
