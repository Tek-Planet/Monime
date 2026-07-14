import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cake } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMemo } from 'react'
import { format, differenceInDays, isSameDay, parseISO } from 'date-fns'
import { enUS, fr, ar } from 'date-fns/locale'

interface BirthdayRemindersProps {
  businessId?: string
}

export function BirthdayReminders({ businessId }: BirthdayRemindersProps) {
  const { customers, loading } = useCustomers(businessId)
  const { t, language } = useLanguage()

  const dateLocale = useMemo(() => {
    switch (language) {
      case 'fr': return fr
      case 'ar': return ar
      default: return enUS
    }
  }, [language])

  const upcomingBirthdays = useMemo(() => {
    if (!customers.length) return []

    const today = new Date()
    const upcomingDays = 7 // Show birthdays within the next 7 days

    return customers
      .filter(customer => customer.birthday)
      .map(customer => {
        const birthdayDate = parseISO(customer.birthday!)
        const thisYearBirthday = new Date(today.getFullYear(), birthdayDate.getMonth(), birthdayDate.getDate())
        
        // If birthday has passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1)
        }

        const daysUntil = differenceInDays(thisYearBirthday, today)
        
        return {
          customer,
          daysUntil,
          date: thisYearBirthday,
          isToday: isSameDay(thisYearBirthday, today)
        }
      })
      .filter(item => item.daysUntil >= 0 && item.daysUntil <= upcomingDays)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [customers])

  if (loading || upcomingBirthdays.length === 0) return null

  const formatDaysUntil = (daysUntil: number) => {
    return t('dashboard.inDays').replace('{days}', daysUntil.toString())
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          <CardTitle>{t('dashboard.upcomingBirthdays')}</CardTitle>
        </div>
        <CardDescription>
          {t('dashboard.birthdaysNext7Days')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingBirthdays.map(({ customer, daysUntil, date, isToday }) => (
            <div 
              key={customer.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Cake className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(date, 'MMMM d', { locale: dateLocale })}
                  </p>
                </div>
              </div>
              <Badge variant={isToday ? "default" : "secondary"}>
                {isToday ? `${t('dashboard.today')} 🎉` : formatDaysUntil(daysUntil)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
