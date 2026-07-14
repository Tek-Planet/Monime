import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useInventory, type InventoryItem } from "@/hooks/useInventory"
import { useSuppliers } from "@/hooks/useSuppliers"

interface RestockItemData {
  inventoryId: string
  productName: string
  quantity: number
  unitCost: number
  supplierId: string
  total: number
}

interface RestockModalProps {
  children?: React.ReactNode
  onRestockComplete?: () => void
}

export function RestockModal({ children, onRestockComplete }: RestockModalProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<RestockItemData[]>([
    { inventoryId: "", productName: "", quantity: 1, unitCost: 0, supplierId: "", total: 0 },
  ])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const { inventory, updateStock } = useInventory()
  const { suppliers } = useSuppliers()

  // Filter only active inventory items
  const activeInventory = inventory.filter(item => item.is_active !== false)

  const addItem = () => {
    setItems([...items, { inventoryId: "", productName: "", quantity: 1, unitCost: 0, supplierId: "", total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof RestockItemData, value: string | number) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value }
        
        // If selecting a product, auto-fill the product name and cost price
        if (field === "inventoryId" && typeof value === "string") {
          const inventoryItem = activeInventory.find(inv => inv.id === value)
          if (inventoryItem) {
            updated.productName = inventoryItem.name
            updated.unitCost = inventoryItem.cost_price || 0
            updated.total = updated.quantity * updated.unitCost
          }
        }
        
        if (field === "quantity" || field === "unitCost") {
          updated.total = updated.quantity * updated.unitCost
        }
        return updated
      }
      return item
    })
    setItems(updatedItems)
  }

  const totalCost = items.reduce((sum, item) => sum + item.total, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleRestock = async () => {
    setLoading(true)
    
    try {
      // Update inventory stock for each item
      for (const item of items) {
        if (item.inventoryId) {
          const inventoryItem = inventory.find(inv => inv.id === item.inventoryId)
          if (inventoryItem) {
            const newQuantity = inventoryItem.stock_quantity + item.quantity
            await updateStock(item.inventoryId, newQuantity)
          }
        }
      }

      toast({
        title: "Restock Complete",
        description: `${items.length} product(s) restocked with ${totalQuantity} total units`,
      })
      
      setOpen(false)
      setItems([{ inventoryId: "", productName: "", quantity: 1, unitCost: 0, supplierId: "", total: 0 }])
      setNotes("")
      onRestockComplete?.()
    } catch (error) {
      console.error("Error restocking:", error)
      toast({
        title: "Error",
        description: "Failed to complete restock. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isValid = items.every(item => item.inventoryId && item.quantity > 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Restock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Restock Inventory
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Items to Restock</h3>
              <Button onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Item {index + 1}</span>
                    {items.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Minus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label>Product</Label>
                      <Select 
                        value={item.inventoryId} 
                        onValueChange={(value) => updateItem(index, "inventoryId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product to restock" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeInventory.map((inv) => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {inv.name} (Current: {inv.stock_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quantity to Add</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div>
                      <Label>Unit Cost (Le)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, "unitCost", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label>Supplier (Optional)</Label>
                      <Select 
                        value={item.supplierId} 
                        onValueChange={(value) => updateItem(index, "supplierId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground text-sm">Item Total:</span>
                      <span className="font-semibold">Le {item.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Restock Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Products:</span>
                  <span className="font-semibold">{items.filter(i => i.inventoryId).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Units:</span>
                  <span className="font-semibold">{totalQuantity}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t">
                  <span className="font-semibold">Total Cost:</span>
                  <span className="font-bold text-primary">Le {totalCost.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any notes for this restock..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleRestock}
              className="flex-1"
              disabled={!isValid || loading}
            >
              {loading ? "Processing..." : "Complete Restock"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
