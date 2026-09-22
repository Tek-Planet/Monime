import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { User, CheckCircle2 } from 'lucide-react'

interface UserDetailsFormProps {
  onComplete: (data: { firstName: string; lastName: string; phone: string }) => void
  loading?: boolean
  onProgressUpdate?: (percent: number) => void
}

export function UserDetailsForm({ onComplete, loading = false, onProgressUpdate }: UserDetailsFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const { toast } = useToast()

  const userProgress = useMemo(() => {
    let p = 0
    if (firstName.trim()) p += 40
    if (lastName.trim()) p += 40
    if (phone.trim()) p += 20
    return p
  }, [firstName, lastName, phone])

  useEffect(() => {
    onProgressUpdate?.(userProgress)
  }, [userProgress, onProgressUpdate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your first and last name",
        variant: "destructive"
      })
      return
    }

    onComplete({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim()
    })
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-elegant border-border/60">
      <CardHeader className="text-center pb-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Personal Information</CardTitle>
        <CardDescription className="text-sm max-w-md mx-auto">
          Let's get to know you better. Please provide your personal details to get started.
        </CardDescription>

        {/* Progress Tracker inside Card */}
        <div className="pt-3 pb-1 px-1 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span>Section Completion</span>
              {userProgress === 100 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
              )}
            </span>
            <span className="font-bold text-primary">{userProgress}%</span>
          </div>
          <Progress value={userProgress} className="h-2 bg-muted/80" />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}