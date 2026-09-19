import { useState, useEffect, useRef } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  Camera,
  Shield,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Image,
  FileText,
  Upload,
  X,
  Search,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { orpc } from '@/server/client'
import { useCurrentUser } from '@/hooks/auth'
import { uploadFile } from '@/lib/storage'
import { ImageCropDialog } from '@/components/layout/image-crop-dialog'

interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  profileImage?: string | null
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
  updatedAt?: string | null
}

export function ProfilePage() {
  const { data: authUser } = useCurrentUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Profile form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Profile image
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageTab, setImageTab] = useState('upload')
  const [imageDocs, setImageDocs] = useState<any[]>([])
  const [imageDocsLoading, setImageDocsLoading] = useState(false)
  const [imageDocsSearch, setImageDocsSearch] = useState('')
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageFileInputRef = useRef<HTMLInputElement>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState('')

  // Messages
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) return
      try {
        const data = await orpc.profile.get({ token }) as UserProfile | null
        if (data) {
          setProfile(data)
          setFirstName(data.firstName || '')
          setLastName(data.lastName || '')
          setPhone(data.phone || '')
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const clearMessages = () => {
    setSuccessMsg('')
    setErrorMsg('')
  }

  // Handle profile update
  const handleProfileUpdate = async () => {
    clearMessages()
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('First name and last name are required')
      return
    }
    const token = localStorage.getItem('auth_token')
    if (!token) return

    setSaving(true)
    try {
      const updated = await orpc.profile.update({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      }) as UserProfile | null
      if (updated) {
        setProfile(updated)
        // Update stored user name
        const stored = localStorage.getItem('auth_user')
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.name = `${updated.firstName} ${updated.lastName}`
          localStorage.setItem('auth_user', JSON.stringify(parsed))
        }
        setSuccessMsg('Profile updated successfully')
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    clearMessages()
    if (!currentPassword || !newPassword) {
      setErrorMsg('Please fill in all password fields')
      return
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match')
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) return

    setChangingPassword(true)
    try {
      await orpc.profile.changePassword({
        token,
        currentPassword,
        newPassword,
      })
      setSuccessMsg('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  // Fetch documents for image picker
  const fetchImageDocs = async () => {
    setImageDocsLoading(true)
    try {
      const docs = await orpc.documents.list({}) as any[]
      // Filter to only image documents
      setImageDocs(docs.filter((d: any) => d.mimeType?.startsWith('image/') || d.fileData?.startsWith('data:image/')))
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setImageDocsLoading(false)
    }
  }

  // Open image dialog
  const handleOpenImageDialog = () => {
    setImageDialogOpen(true)
    setSelectedDocImage(null)
    setImageUrlInput('')
    fetchImageDocs()
  }

  // Handle file upload for profile image → open crop dialog
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file')
      return
    }
    // Read file as data URL for cropping
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result as string)
      setCropOpen(true)
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  // Handle picking image from documents → open crop dialog
  const handlePickDocImage = () => {
    if (!selectedDocImage) return
    const doc = imageDocs.find((d: any) => d.id === Number(selectedDocImage))
    if (!doc) return
    const imageUrl = doc.fileData || doc.fileUrl
    if (!imageUrl) return
    setCropImageSrc(imageUrl)
    setCropOpen(true)
  }

  // Handle URL input → open crop dialog
  const handleUrlImage = () => {
    if (!imageUrlInput.trim()) return
    if (!imageUrlInput.startsWith('http') && !imageUrlInput.startsWith('data:image/')) {
      setErrorMsg('Please enter a valid image URL')
      return
    }
    setCropImageSrc(imageUrlInput.trim())
    setCropOpen(true)
  }

  // Save profile image to database
  const saveProfileImage = async (imageUrl: string) => {
    const token = localStorage.getItem('auth_token')
    if (!token) return
    try {
      const updated = await orpc.profile.update({
        token,
        profileImage: imageUrl,
      }) as UserProfile | null
      if (updated) {
        setProfile(updated)
        setImageDialogOpen(false)
        setSuccessMsg('Profile image updated successfully')
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update profile image')
    }
  }

  // Remove profile image
  const handleRemoveImage = async () => {
    await saveProfileImage('')
  }

  // Handle crop complete → save the cropped data URL
  const handleCropComplete = async (croppedDataUrl: string) => {
    await saveProfileImage(croppedDataUrl)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p>Failed to load profile. Please try again.</p>
      </div>
    )
  }

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
  const memberSince = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'N/A'
  const lastLogin = profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Never'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and personal information</p>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group cursor-pointer" onClick={handleOpenImageDialog}>
              <Avatar className="h-24 w-24">
                {profile.profileImage && (
                  <AvatarImage src={profile.profileImage} alt={`${profile.firstName} ${profile.lastName}`} />
                )}
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                  <Shield className="mr-1 h-3 w-3" />
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  <Calendar className="mr-1 h-3 w-3" />
                  Member since {memberSince}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="pl-9 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  variant="outline"
                >
                  {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium capitalize">{authUser?.role || 'Admin'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-medium text-xs">{lastLogin}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium text-xs">{memberSince}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  Use a strong, unique password
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  Change your password regularly
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  Keep your contact info updated
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        outputSize={400}
      />

      {/* ============================================
          PROFILE IMAGE PICKER DIALOG
          ============================================ */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Change Profile Image</DialogTitle>
            <DialogDescription>
              Upload a new image, pick from documents, or enter a URL
            </DialogDescription>
          </DialogHeader>
          
          {/* Current preview */}
          <div className="flex justify-center py-4">
            <Avatar className="h-20 w-20">
              {profile?.profileImage && (
                <AvatarImage src={profile.profileImage} alt="Preview" />
              )}
              <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <Tabs value={imageTab} onValueChange={setImageTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-1">
                <Upload className="h-3 w-3" /> Upload
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1">
                <FileText className="h-3 w-3" /> Documents
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-1">
                <Image className="h-3 w-3" /> URL
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div
                className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                onClick={() => imageFileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to select an image</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP</p>
              </div>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {uploadingImage && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search image documents..."
                  value={imageDocsSearch}
                  onChange={(e) => setImageDocsSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {imageDocsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : imageDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No image documents found</p>
                  <p className="text-xs mt-1">Upload images to Documents first</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {imageDocs
                    .filter((d: any) => 
                      !imageDocsSearch || 
                      d.title?.toLowerCase().includes(imageDocsSearch.toLowerCase()) ||
                      d.fileName?.toLowerCase().includes(imageDocsSearch.toLowerCase())
                    )
                    .map((doc: any) => (
                      <div
                        key={doc.id}
                        className={`relative rounded-lg border-2 cursor-pointer overflow-hidden transition-all aspect-square ${
                          selectedDocImage === String(doc.id)
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedDocImage(String(doc.id))}
                      >
                        {doc.fileData ? (
                          <img src={doc.fileData} alt={doc.title} className="w-full h-full object-cover" />
                        ) : doc.fileUrl ? (
                          <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {selectedDocImage === String(doc.id) && (
                          <div className="absolute top-1 right-1">
                            <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5">
                          <p className="text-[10px] text-white truncate text-center">{doc.title}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <Button
                onClick={handlePickDocImage}
                disabled={!selectedDocImage}
                className="w-full"
              >
                <Check className="mr-2 h-4 w-4" /> Use Selected Image
              </Button>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/photo.jpg or data:image/..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
              </div>
              {imageUrlInput && (
                <div className="flex justify-center">
                  <div className="rounded-lg border overflow-hidden bg-muted/50 p-2">
                    <img
                      src={imageUrlInput}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded"
                      onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                </div>
              )}
              <Button
                onClick={handleUrlImage}
                disabled={!imageUrlInput.trim()}
                className="w-full"
              >
                <Image className="mr-2 h-4 w-4" /> Set Image from URL
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {profile?.profileImage && (
              <Button variant="destructive" onClick={handleRemoveImage} className="sm:order-1">
                <X className="mr-2 h-4 w-4" /> Remove Image
              </Button>
            )}
            <Button variant="outline" onClick={() => setImageDialogOpen(false)} className="sm:order-2">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
