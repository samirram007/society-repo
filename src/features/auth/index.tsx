import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Building2, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/auth'
import type { LoginInput } from '@/lib/validations'

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    loginMutation.mutate(formData, {
      onSuccess: () => {
        navigate({ to: '/' })
      },
      onError: (error) => {
        setErrors({
          general: error.message || 'Invalid email or password',
        })
      },
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md px-4">
        {/* Logo & Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Society ERP</h1>
          <p className="text-muted-foreground">
            Housing Society Management System
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.general}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@society.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loginMutation.isPending}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={loginMutation.isPending}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Button variant="link" className="h-auto p-0 text-sm" type="button">
                  Forgot password?
                </Button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 rounded-md bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Demo Credentials</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> <strong>Developer:</strong> rajesh@society.com / admin123</span></p>
                <p><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> <strong>Admin:</strong> priya@society.com / resident123</span></p>
                <p><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> <strong>SuperAdmin:</strong> amit@society.com / resident123</span></p>
                <p><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> <strong>Staff:</strong> vikram@society.com / resident123</span></p>
                <p><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" /> <strong>Member:</strong> suresh@society.com / resident123</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Housing Society Management ERP © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
