"use client"
import { API_BASE } from "@/config/api"
import { useState, useEffect } from "react"
import { useApp } from "@/context/app-context"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ChefHat, Utensils, Loader2 } from "lucide-react"

export default function AdminMenuPage() {
  const { state, fetchMenu } = useApp()
  const [menuItems, setMenuItems] = useState(state.menu)
  const [showAddMenuDialog, setShowAddMenuDialog] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: ''
  })

  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    try {
      setLoading(true)
      setError(null)
      await fetchMenu()
      setMenuItems(state.menu)
    } catch (err) {
      console.error('Error loading menu:', err)
      setError('Failed to load menu items. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMenuItem = async () => {
    if (!state.token) {
      alert('Please login to add menu items')
      return
    }

    if (!menuForm.name || !menuForm.price) {
      alert('Please fill in required fields: Name and Price')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}menu/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
          category: menuForm.category || 'Main Course',
          image: menuForm.image || '/placeholder.svg'
        }),
      })

      if (response.ok) {
        const newItem = await response.json()
        await fetchMenu()
        setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
        setShowAddMenuDialog(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add menu item')
      }
    } catch (error: any) {
      console.error('Error adding menu item:', error)
      alert(error.message || 'Error adding menu item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItem(item.id)
    setMenuForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description || '',
      category: item.category || '',
      image: item.image || ''
    })
  }

  const handleUpdateMenuItem = async () => {
    if (!editingMenuItem || !state.token) return

    if (!menuForm.name || !menuForm.price) {
      alert('Please fill in required fields: Name and Price')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}menu/${editingMenuItem}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
          category: menuForm.category || 'Main Course',
          image: menuForm.image || '/placeholder.svg'
        }),
      })

      if (response.ok) {
        await fetchMenu()
        setEditingMenuItem(null)
        setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update menu item')
      }
    } catch (error: any) {
      console.error('Error updating menu item:', error)
      alert(error.message || 'Error updating menu item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    if (!state.token) return

    try {
      const response = await fetch(`${API_BASE}menu/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      })

      if (response.ok) {
        await fetchMenu()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete menu item')
      }
    } catch (error: any) {
      console.error('Error deleting menu item:', error)
      alert(error.message || 'Error deleting menu item')
    }
  }

  const categories = ['Main Course', 'Appetizers', 'Desserts', 'Beverages', 'Salads', 'Soups']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Menu Management</h1>
              <p className="text-gray-600 mt-1">Manage your restaurant menu items</p>
            </div>
            
            <Dialog open={showAddMenuDialog || editingMenuItem !== null} onOpenChange={(open) => {
              if (!open) {
                setShowAddMenuDialog(false)
                setEditingMenuItem(null)
                setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setShowAddMenuDialog(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                  <DialogDescription>
                    {editingMenuItem ? 'Update menu item details' : 'Add a new item to your menu'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="required">Name</Label>
                    <Input
                      id="name"
                      value={menuForm.name}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Item name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="required">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={menuForm.price}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={menuForm.category}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={menuForm.description}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Item description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={menuForm.image}
                      onChange={(e) => setMenuForm(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingMenuItem ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        editingMenuItem ? 'Update Item' : 'Add Item'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddMenuDialog(false)
                        setEditingMenuItem(null)
                        setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {state.menu.length > 0 ? (
              state.menu.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <Card className="border border-gray-200 hover:border-gray-300 transition-colors h-full flex flex-col">
                    <div className="relative overflow-hidden aspect-square">
                      <img 
                        src={item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-gray-900 text-white">
                          ₹{item.price.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold mb-2 line-clamp-1">
                          {item.name}
                        </CardTitle>
                        {item.category && (
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        )}
                        {item.description && (
                          <CardDescription className="text-sm leading-relaxed line-clamp-2 mb-4">
                            {item.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          onClick={() => handleEditMenuItem(item)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteMenuItem(item.id)}
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Menu Items</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Get started by adding your first menu item
                </p>
                <Button
                  onClick={() => setShowAddMenuDialog(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Filters (Optional) */}
        {state.menu.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-300"
              >
                All Items
              </Button>
              {categories.map((category) => (
                <Button 
                  key={category}
                  variant="outline" 
                  size="sm"
                  className="border-gray-300"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}