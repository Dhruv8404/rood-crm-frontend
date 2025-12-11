"use client"
import { API_BASE } from "@/config/api"
import { useState } from "react"
import { useApp } from "@/context/app-context"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ChefHat, Sparkles, Utensils } from "lucide-react"

export default function AdminMenuPage() {
  const { state } = useApp()
  const [menuItems, setMenuItems] = useState(state.menu)
  const [showAddMenuDialog, setShowAddMenuDialog] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<string | null>(null)
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: ''
  })

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  const handleAddMenuItem = async () => {
    if (!state.token) return
    try {
    const response = await fetch(API_BASE + 'menu/', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
          category: menuForm.category,
          image: menuForm.image || '/placeholder.svg'
        }),
      })
      if (response.ok) {
        const newItem = await response.json()
        setMenuItems(prev => [...prev, newItem])
        setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
        setShowAddMenuDialog(false)
        window.location.reload()
      } else {
        alert('Failed to add menu item')
      }
    } catch (error) {
      console.error(error)
      alert('Error adding menu item')
    }
  }

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItem(item.id)
    setMenuForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description,
      category: item.category,
      image: item.image
    })
  }

  const handleUpdateMenuItem = async () => {
    if (!editingMenuItem || !state.token) return
    try {
 const response = await fetch(API_BASE + `menu/${editingMenuItem}/`, {

        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          name: menuForm.name,
          price: parseFloat(menuForm.price),
          description: menuForm.description,
          category: menuForm.category,
          image: menuForm.image || '/placeholder.svg'
        }),
      })
      if (response.ok) {
        const updatedItem = await response.json()
        setMenuItems(prev => prev.map(item => item.id === editingMenuItem ? updatedItem : item))
        setEditingMenuItem(null)
        setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
        window.location.reload()
      } else {
        alert('Failed to update menu item')
      }
    } catch (error) {
      console.error(error)
      alert('Error updating menu item')
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    if (!state.token) return
    try {
      const response = await fetch(API_BASE + `menu/${id}/`, {

        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.token}`,
        },
      })
      if (response.ok) {
        setMenuItems(prev => prev.filter(item => item.id !== id))
        window.location.reload()
      } else {
        alert('Failed to delete menu item')
      }
    } catch (error) {
      console.error(error)
      alert('Error deleting menu item')
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-blue-200 mb-4"
          >
            <Utensils className="h-5 w-5 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Menu Management
            </h1>
          </motion.div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your restaurant menu items. Add, edit, or remove dishes as needed.
          </p>
        </div>

        {/* Add Menu Item Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end mb-6"
        >
          <Dialog open={showAddMenuDialog || editingMenuItem !== null} onOpenChange={(open) => {
            if (!open) {
              setShowAddMenuDialog(false)
              setEditingMenuItem(null)
              setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
            }
          }}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setShowAddMenuDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Name</Label>
                  <Input
                    id="name"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Item name"
                    className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={menuForm.description}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Item description"
                    className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                  <Input
                    id="category"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Main Course, Dessert"
                    className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-sm font-semibold">Image URL</Label>
                  <Input
                    id="image"
                    value={menuForm.image}
                    onChange={(e) => setMenuForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="Image URL (optional)"
                    className="border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button 
                      onClick={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0"
                    >
                      {editingMenuItem ? 'Update Item' : 'Add Item'}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddMenuDialog(false)
                        setEditingMenuItem(null)
                        setMenuForm({ name: '', price: '', description: '', category: '', image: '' })
                      }}
                      className="border-2 border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Menu Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence>
            {state.menu.map((item) => (
              <motion.div key={item.id} variants={itemVariants} layout>
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }} 
                    className="h-full flex flex-col"
                  >
                    <div className="relative overflow-hidden">
                      <img 
                        src={item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Badge className="absolute top-3 right-3 bg-white/90 text-black backdrop-blur-sm border-0 shadow-lg">
                        ₹{item.price.toFixed(2)}
                      </Badge>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </CardTitle>
                        <div className="mb-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            {item.category || 'Uncategorized'}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm leading-relaxed line-clamp-2 mb-4">
                          {item.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <Button
                            onClick={() => handleEditMenuItem(item)}
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="border-0"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        <AnimatePresence>
          {state.menu.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Utensils className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 mb-3">No Menu Items</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Get started by adding your first menu item. Create delicious dishes for your customers to enjoy.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowAddMenuDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}