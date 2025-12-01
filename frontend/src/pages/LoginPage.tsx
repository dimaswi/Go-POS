import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi, settingsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { setPageTitle, getAppName } from '@/lib/page-title';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState('StarterKits');

  useEffect(() => {
    setPageTitle('Masuk');
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getAll();
      const settings = response.data.data;
      
      if (settings.app_name) {
        setAppName(settings.app_name);
        localStorage.setItem('appName', settings.app_name);
      }
      if (settings.app_subtitle) {
        localStorage.setItem('appSubtitle', settings.app_subtitle);
      }
    } catch (error) {
      // Use default if API fails
      setAppName(getAppName());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-0 shadow-sm">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded bg-foreground text-background">
              <Building2 className="size-4" />
            </div>
            <span className="text-lg font-semibold">{appName}</span>
          </div>
          <CardTitle className="text-xl font-semibold">Masuk</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Masukkan kredensial Anda untuk mengakses akun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@simrs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded border border-destructive/20">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
              {loading ? 'Sedang masuk...' : 'Masuk'}
            </Button>
          </form>
          <div className="mt-4 text-xs text-center text-muted-foreground border-t pt-4">
            <p className="mb-1.5">Kredensial demo</p>
            <div className="font-mono bg-muted/30 p-2 rounded text-[11px]">
              admin@simrs.com / admin123
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
