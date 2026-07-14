import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useInvoices } from '@/hooks/useInvoices'
import { useToast } from '@/hooks/use-toast'

interface InvoiceStatusSelectProps {
  invoiceId: string
  currentStatus: string
  totalAmount: number
  onStatusChange?: () => void
}

export function InvoiceStatusSelect({ invoiceId, currentStatus, totalAmount, onStatusChange }: InvoiceStatusSelectProps) {
  const { updateInvoice } = useInvoices()
  const { toast } = useToast()

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'overdue': return 'destructive'
      case 'sent': return 'default'
      case 'draft': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updates: any = { status: newStatus }
      
      // When marking as paid, set paid_amount to total_amount
      if (newStatus === 'paid') {
        updates.paid_amount = totalAmount
      }
      // When changing to cancelled or from paid to other status, reset paid_amount to 0
      else if (newStatus === 'cancelled' || currentStatus === 'paid') {
        updates.paid_amount = 0
      }
      
      await updateInvoice(invoiceId, updates)
      onStatusChange?.()
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      })
    }
  }

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[140px] h-8">
        <Badge variant={getStatusVariant(currentStatus)} className="border-0 text-xs">
          {currentStatus}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">
          <Badge variant="secondary" className="text-xs">Draft</Badge>
        </SelectItem>
        <SelectItem value="sent">
          <Badge variant="default" className="text-xs">Sent</Badge>
        </SelectItem>
        <SelectItem value="paid">
          <Badge variant="success" className="text-xs">Paid</Badge>
        </SelectItem>
        <SelectItem value="overdue">
          <Badge variant="destructive" className="text-xs">Overdue</Badge>
        </SelectItem>
        <SelectItem value="cancelled">
          <Badge variant="destructive" className="text-xs">Cancelled</Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}