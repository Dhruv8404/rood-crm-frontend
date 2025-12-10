"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Role = "guest" | "customer" | "chef" | "admin"

export type CartItem = {
  id: string
  name: string
  price: number
  qty: number
}

export type OrderStatus = "pending" | "preparing" | "completed" | "paid"

export type Order = {
  id: string
  items: CartItem[]
  total: number
  status: OrderStatus
  customer: { phone: string; email: string }
  table_no?: string | null
  createdAt: number
}

export type MenuItem = {
  id: string
  name: string
  price: number
  description: string
  category: string
  image: string
}

const API_BASE = 'http://localhost:8000/api/'

type User = {
  role: Role
  phone?: string
  email?: string
}

type PendingOrderData = {
  items: CartItem[]
  table_no: string | null
}

type State = {
  user: User
  cart: CartItem[]
  orders: Order[]
  menu: MenuItem[]
  token: string | null
  currentTable: string | null
  pendingOrder: PendingOrderData | null
}

type Ctx = {
  state: State
  addToCart: (id: string) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  loginCustomer: (phone: string, email: string, token: string) => void
  loginStaff: (role: Exclude<Role, "guest" | "customer">, token: string) => void
  logout: () => void
  createOrderFromCart: () => Promise<Order | null>
  markPrepared: (orderId: string) => Promise<void>
  markPaid: (orderId: string) => Promise<void>
  markPreparing: (orderId: string) => Promise<void>
  fetchOrders: () => Promise<void>
  setCurrentTable: (table: string | null) => void
  setPendingOrder: (pending: PendingOrderData | null) => void
}

const AppContext = createContext<Ctx | null>(null)
const LS_KEY = "foodcrm_state_v1"

const initialState: State = {
  user: { role: "guest" },
  cart: [],
  orders: [],
  menu: [],
  token: null,
  currentTable: null,
  pendingOrder: null,
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return initialState
    const raw = window.localStorage.getItem(LS_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed.orders)) parsed.orders = []
        return parsed
      } catch {
        return initialState
      }
    }
    return initialState
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state))
    }
  }, [state])

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(API_BASE + 'menu/')
        const data = await res.json()
        setState(s => ({ ...s, menu: data }))
      } catch (e) {
        console.error('Failed to fetch menu:', e)
      }
    }
    fetchMenu()
  }, [])

  const fetchOrders = async () => {
    if (!state.token) {
      setState(s => ({ ...s, orders: [] }))
      return
    }
    try {
      const res = await fetch(API_BASE + 'orders/', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      })
      if (res.status === 401 || res.status === 403) {
        logout()
        return
      }
      const data = res.ok ? await res.json() : []
      setState(s => ({ ...s, orders: data }))
    } catch (e) {
      setState(s => ({ ...s, orders: [] }))
      console.error('Failed to fetch orders:', e)
    }
  }

  useEffect(() => {
    if (state.user.role === 'chef' || state.user.role === 'admin') {
      fetchOrders()
    }
  }, [state.user.role, state.token])

  const addToCart = (id: string) => {
    const item = state.menu.find((m) => m.id === id)
    if (!item) return
    setState((s) => {
      const existing = s.cart.find((c) => c.id === id)
      const next = existing
        ? s.cart.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c))
        : [...s.cart, { id, name: item.name, price: item.price, qty: 1 }]
      return { ...s, cart: next }
    })
  }

  const removeFromCart = (id: string) => setState((s) => ({ ...s, cart: s.cart.filter((c) => c.id !== id) }))

  const updateQty = (id: string, qty: number) =>
    setState((s) => ({
      ...s,
      cart: s.cart.map((c) => (c.id === id ? { ...c, qty: Math.max(1, qty) } : c)),
    }))

  const clearCart = () => setState((s) => ({ ...s, cart: [] }))

  const loginCustomer = (phone: string, email: string, token: string) =>
    setState((s) => ({ ...s, user: { role: "customer", phone, email }, token }))

  const loginStaff = (role: "chef" | "admin", token: string) => setState((s) => ({ ...s, user: { role }, token }))

  const logout = () => setState((s) => ({ ...s, user: { role: "guest" }, currentTable: null }))

  const setCurrentTable = (table: string | null) => setState((s) => ({ ...s, currentTable: table }))

  const setPendingOrder = (pending: PendingOrderData | null) => setState((s) => ({ ...s, pendingOrder: pending }))

  const createOrderFromCart = async () => {
    if (state.user.role !== "customer" || state.cart.length === 0) return null
    const total = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0)
    const order: Order = {
      id: "ord_" + Math.random().toString(36).slice(2, 9),
      items: state.cart,
      total,
      status: "pending",
      customer: {
        phone: state.user.phone!,
        email: state.user.email!,
      },
      createdAt: Date.now(),
      table_no: state.currentTable,
    }
    try {
      const response = await fetch(API_BASE + 'orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(order)
      })
      if (response.ok) {
        setState((s) => ({ ...s, orders: [order, ...s.orders], cart: [] }))
        return order
      } else if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again.')
        return null
      } else {
        console.error('Failed to create order:', response.status)
        alert('Failed to place order. Please try again.')
        return null
      }
    } catch (e) {
      console.error('Failed to create order:', e)
      alert('Failed to place order. Please try again.')
      return null
    }
  }

  const markPrepared = async (orderId: string) => {
    if (!state.token) return
    try {
      const response = await fetch(API_BASE + `orders/${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ status: "completed" })
      })
      if (response.ok) {
        await fetchOrders()
      } else if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again.')
      } else {
        console.error('Failed to mark prepared:', response.status)
      }
    } catch (e) {
      console.error('Failed to mark prepared:', e)
    }
  }

  const markPreparing = async (orderId: string) => {
    if (!state.token) return
    try {
      const response = await fetch(API_BASE + `orders/${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ status: "preparing" })
      })
      if (response.ok) {
        await fetchOrders()
      } else if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again.')
      } else {
        console.error('Failed to mark preparing:', response.status)
      }
    } catch (e) {
      console.error('Failed to mark preparing:', e)
    }
  }

  const markPaid = async (orderId: string) => {
    if (!state.token) return
    try {
      const response = await fetch(API_BASE + `orders/${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ status: "paid" })
      })
      if (response.ok) {
        await fetchOrders()
      } else if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again.')
      } else {
        console.error('Failed to mark paid:', response.status)
      }
    } catch (e) {
      console.error('Failed to mark paid:', e)
    }
  }

  const value = useMemo<Ctx>(
    () => ({
      state,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      loginCustomer,
      loginStaff,
      logout,
      createOrderFromCart,
      markPrepared,
      markPaid,
      markPreparing,
      fetchOrders,
      setCurrentTable,
      setPendingOrder,
    }),
    [state],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
