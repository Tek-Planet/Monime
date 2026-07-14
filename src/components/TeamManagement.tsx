import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers'
import { useLanguage } from '@/contexts/LanguageContext'
import { UserPlus, Mail, Trash2, Settings, Loader2 } from 'lucide-react'
import { InviteMemberModal } from './InviteMemberModal'
import { EditMemberAccessModal } from './EditMemberAccessModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function TeamManagement() {
  const { t } = useLanguage()
  const { members, invitations, loading, removeMember, cancelInvitation, refetch } = useOrganizationMembers()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editMemberId, setEditMemberId] = useState<string | null>(null)
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)
  const [cancelInvitationId, setCancelInvitationId] = useState<string | null>(null)

  const getPageName = (page: string) => {
    return t(`nav.${page}` as any) || page
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">{t('team.teamManagement')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('team.inviteAndManage')}</p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          {t('team.inviteMember')}
        </Button>
      </div>

      {/* Active Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{t('team.teamMembers')}</CardTitle>
          <CardDescription>{t('team.teamMembersDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('team.noMembersYet')}
              </p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.display_name || member.email || `User ${member.user_id.slice(0, 8)}`}
                      </p>
                      {member.role === 'owner' && (
                        <Badge variant="secondary">{t('team.owner')}</Badge>
                      )}
                    </div>
                    {member.email && (
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.accessible_pages.map((page) => (
                        <Badge key={page} variant="outline" className="text-xs font-normal">
                          {getPageName(page)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditMemberId(member.id)}
                      disabled={member.role === 'owner'}
                      aria-label={t('team.editMemberAccess')}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoveMemberId(member.id)}
                      disabled={member.role === 'owner'}
                      aria-label={t('team.removeMember')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">{t('team.pendingInvitations')}</CardTitle>
            <CardDescription>{t('team.pendingInvitationsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 border rounded-lg"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    <Mail className="h-5 w-5 text-muted-foreground mt-1 sm:mt-0" />
                    <div className="flex-1">
                      <p className="font-medium break-all">{invitation.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {invitation.accessible_pages.map((page) => (
                          <Badge key={page} variant="outline" className="text-xs font-normal">
                            {getPageName(page)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelInvitationId(invitation.id)}
                    className="self-end sm:self-center"
                  >
                    {t('modal.cancel')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals and Dialogs */}
      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInviteSent={refetch}
      />

      {editMemberId && (
        <EditMemberAccessModal
          memberId={editMemberId}
          onClose={() => setEditMemberId(null)}
        />
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMemberId} onOpenChange={() => setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('team.removeMember')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team.removeMemberConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('modal.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (removeMemberId) {
                  removeMember(removeMemberId)
                  setRemoveMemberId(null)
                }
              }}
            >
              {t('team.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation */}
      <AlertDialog open={!!cancelInvitationId} onOpenChange={() => setCancelInvitationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('team.cancelInvitation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('team.cancelInvitationConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.no')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelInvitationId) {
                  cancelInvitation(cancelInvitationId)
                  setCancelInvitationId(null)
                }
              }}
            >
              {t('team.yesCancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
