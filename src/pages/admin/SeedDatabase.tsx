import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Database } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SeedDatabase() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(100)

  const handleSeed = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('seed-database', {
        body: { count }
      })

      if (error) throw error

      toast.success(`${t("admin.seedSuccess")} ${count} ${t("admin.records")}`)
      console.log('Seeding result:', data)
    } catch (error: any) {
      console.error('Seeding error:', error)
      toast.error(error.message || t("admin.seedFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("admin.seedDatabaseTitle")}
          </CardTitle>
          <CardDescription>
            {t("admin.seedDatabaseDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="count">{t("admin.numberOfRecords")}</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="1000"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 100)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              {t("admin.seedDatabaseNote")}
            </p>
          </div>

          <Button 
            onClick={handleSeed} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("admin.seedingDatabase")}
              </>
            ) : (
              t("admin.seedDatabaseTitle")
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
