import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Capacitor } from '@capacitor/core'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string
  currentFilePath?: string
  userInitials: string
  onPhotoUpdate?: (photoUrl: string | null) => void
}

// Convert a base64 data URL to a File object
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

export function ProfilePhotoUpload({ currentPhotoUrl, currentFilePath, userInitials, onPhotoUpdate }: ProfilePhotoUploadProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null)
  const [filePath, setFilePath] = useState<string | null>(currentFilePath || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (!user || !user.id) {
      toast.error('Please log in first to upload photos')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}/profile-photo.${fileExt}`

      if (filePath) {
        await supabase.storage.from('profile-documents').remove([filePath])
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: signed, error: signedError } = await supabase.storage
        .from('profile-documents')
        .createSignedUrl(fileName, 3600)
      if (signedError) throw signedError

      await supabase
        .from('profile_documents')
        .delete()
        .eq('user_id', user.id)
        .eq('document_type', 'profile_photo')

      const { error: insertError } = await supabase
        .from('profile_documents')
        .insert([{
          user_id: user.id,
          file_name: file.name,
          file_path: fileName,
          document_type: 'profile_photo',
          file_size: file.size
        }])
      if (insertError) throw insertError

      setPhotoUrl(signed?.signedUrl || null)
      setFilePath(fileName)
      onPhotoUpdate?.(signed?.signedUrl || null)
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] })
      toast.success('Profile photo updated successfully')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleNativeCamera = async () => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Let user choose camera or gallery
        width: 800,
        height: 800,
      })

      if (photo.dataUrl) {
        const file = dataURLtoFile(photo.dataUrl, `profile-photo.${photo.format || 'jpg'}`)
        await uploadFile(file)
      }
    } catch (error: any) {
      // User cancelled - don't show error
      if (error?.message?.includes('User cancelled') || error?.message?.includes('canceled')) {
        return
      }
      console.error('Camera error:', error)
      toast.error('Failed to capture photo')
    }
  }

  const handleUploadClick = () => {
    // Use native Capacitor Camera on iOS/Android, HTML input on web
    if (Capacitor.isNativePlatform()) {
      handleNativeCamera()
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemovePhoto = async () => {
    if (!user || !filePath) return

    try {
      const { error: storageError } = await supabase.storage
        .from('profile-documents')
        .remove([filePath])
      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('profile_documents')
        .delete()
        .eq('user_id', user.id)
        .eq('document_type', 'profile_photo')
      if (dbError) throw dbError

      setPhotoUrl(null)
      setFilePath(null)
      onPhotoUpdate?.(null)
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] })
      toast.success('Profile photo removed successfully')
    } catch (error) {
      console.error('Error removing photo:', error)
      toast.error('Failed to remove photo')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
        {photoUrl ? (
          <AvatarImage src={photoUrl} alt="Profile photo" />
        ) : (
          <AvatarFallback className="text-base sm:text-lg font-semibold">
            {userInitials}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="space-y-2 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleUploadClick}
            disabled={uploading}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {uploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          
          {photoUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRemovePhoto}
              className="w-full sm:w-auto text-xs sm:text-sm text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Remove Photo
            </Button>
          )}
        </div>
        
        <p className="text-xs sm:text-sm text-muted-foreground">
          JPG, PNG or GIF. Max 2MB.
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
