import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, Edit, Trash2, TrendingUp, AlertTriangle, MapPin, User } from 'lucide-react'
import { type InventoryItem } from '@/hooks/useInventory'
import { format } from 'date-fns'

interface ViewInventoryModalProps {
  item: InventoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  getStockStatus: (item: InventoryItem) => string
}

export function ViewInventoryModal({ 
  item, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete,
  getStockStatus 
}: ViewInventoryModalProps) {
  if (!item) return null

  const status = getStockStatus(item)
  const profitMargin = item.cost_price && item.cost_price > 0 
    ? ((item.unit_price - item.cost_price) / item.unit_price * 100).toFixed(1)
    : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive'
      case 'low': return 'secondary'
      case 'good': return 'default'
      case 'out': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical': return 'Critical Stock'
      case 'low': return 'Low Stock'
      case 'good': return 'In Stock'
      case 'out': return 'Out of Stock'
      default: return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              {item.category && (
                <p className="text-sm text-muted-foreground">{item.category}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={getStatusColor(status)}>
                {getStatusLabel(status)}
              </Badge>
              {!item.is_active && (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Stock Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Stock Information
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Current Stock:</span>
                <span className="ml-2 font-semibold">{item.stock_quantity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min Level:</span>
                <span className="ml-2 font-semibold">{item.min_stock_level || 0}</span>
              </div>
              {item.stock_quantity <= (item.min_stock_level || 0) && item.stock_quantity > 0 && (
                <div className="col-span-2 flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Below minimum stock level</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h4 className="font-medium mb-3">Pricing</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="ml-2 font-semibold">Le {item.unit_price.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cost Price:</span>
                <span className="ml-2 font-semibold">
                  {item.cost_price ? `Le ${item.cost_price.toLocaleString()}` : 'N/A'}
                </span>
              </div>
              {profitMargin && (
                <div>
                  <span className="text-muted-foreground">Profit Margin:</span>
                  <span className={`ml-2 font-semibold ${parseFloat(profitMargin) > 0 ? 'text-prosperity-green' : 'text-destructive'}`}>
                    {profitMargin}%
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Stock Value:</span>
                <span className="ml-2 font-semibold">
                  Le {(item.stock_quantity * item.unit_price).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Details */}
          <div>
            <h4 className="font-medium mb-3">Product Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {item.sku && (
                <div>
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="ml-2 font-medium">{item.sku}</span>
                </div>
              )}
              {item.barcode && (
                <div>
                  <span className="text-muted-foreground">Barcode:</span>
                  <span className="ml-2 font-medium">{item.barcode}</span>
                </div>
              )}
              {item.supplier && (
                <div className="col-span-2 flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Supplier:</span>
                  <span className="ml-1 font-medium">{item.supplier}</span>
                </div>
              )}
              {item.location && (
                <div className="col-span-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="ml-1 font-medium">{item.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {format(new Date(item.created_at), 'PPp')}</p>
            <p>Updated: {format(new Date(item.updated_at), 'PPp')}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="gradient" 
              className="flex-1"
              onClick={() => {
                onEdit(item)
                onOpenChange(false)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(item)
                onOpenChange(false)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
