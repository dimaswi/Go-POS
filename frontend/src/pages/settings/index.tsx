import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Moon, Sun, Building2, Save, Loader2, Gift, Coins, Bot, Eye, EyeOff } from 'lucide-react';
import { settingsApi } from '@/lib/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [appName, setAppName] = useState('StarterKits');
  const [appSubtitle, setAppSubtitle] = useState('Hospital System');
  const [loyaltyMinPurchase, setLoyaltyMinPurchase] = useState('10000');
  const [loyaltyPointValue, setLoyaltyPointValue] = useState('100');
  const [loyaltyMinRedeem, setLoyaltyMinRedeem] = useState('10');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Set page title
  useEffect(() => {
    const savedAppName = localStorage.getItem('appName') || 'StarterKits';
    document.title = `Settings - ${savedAppName}`;
  }, []);

  // Load settings from API and localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from API
      const response = await settingsApi.getAll();
      const settings = response.data.data;
      
      if (settings.app_name) {
        setAppName(settings.app_name);
        localStorage.setItem('appName', settings.app_name);
      }
      if (settings.app_subtitle) {
        setAppSubtitle(settings.app_subtitle);
        localStorage.setItem('appSubtitle', settings.app_subtitle);
      }
      if (settings.loyalty_min_purchase) {
        setLoyaltyMinPurchase(settings.loyalty_min_purchase);
      }
      if (settings.loyalty_point_value) {
        setLoyaltyPointValue(settings.loyalty_point_value);
      }
      if (settings.loyalty_min_redeem) {
        setLoyaltyMinRedeem(settings.loyalty_min_redeem);
      }
      if (settings.groq_api_key) {
        setGroqApiKey(settings.groq_api_key);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setFetching(false);
    }

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const root = document.documentElement;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      root.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    toast({
      variant: "success",
      title: "Success!",
      description: `Theme changed to ${newTheme} mode.`,
    });
  };

  const handleSaveAppSettings = async () => {
    setLoading(true);
    try {
      // Save to API
      await settingsApi.update({
        app_name: appName,
        app_subtitle: appSubtitle,
      });

      // Save to localStorage
      localStorage.setItem('appName', appName);
      localStorage.setItem('appSubtitle', appSubtitle);
      
      // Trigger storage event to update sidebar immediately
      window.dispatchEvent(new Event('storage'));
      
      toast({
        variant: "success",
        title: "Success!",
        description: "Application settings saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLoyaltySettings = async () => {
    setLoyaltyLoading(true);
    try {
      await settingsApi.update({
        loyalty_min_purchase: loyaltyMinPurchase,
        loyalty_point_value: loyaltyPointValue,
        loyalty_min_redeem: loyaltyMinRedeem,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Loyalty settings saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to save loyalty settings. Please try again.",
      });
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleSaveAISettings = async () => {
    setAiLoading(true);
    try {
      await settingsApi.update({
        groq_api_key: groqApiKey,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "AI settings saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to save AI settings. Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="h-7 w-7 sm:h-9 sm:w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-xl lg:text-2xl font-semibold tracking-tight">Pengaturan</h1>
          <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground hidden sm:block">Kelola preferensi aplikasi</p>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {fetching ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Application Settings */}
            <Card className="shadow-md">
              <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm lg:text-base font-semibold">Aplikasi</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Kustomisasi nama dan branding</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="appName" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                      <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                      App Name
                    </Label>
                    <Input
                      id="appName"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="StarterKits"
                      className="max-w-full sm:max-w-md h-8 sm:h-9 text-xs sm:text-sm"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Appears in sidebar and page titles
                    </p>
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="appSubtitle" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                      <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                      Subtitle
                    </Label>
                    <Input
                      id="appSubtitle"
                      value={appSubtitle}
                      onChange={(e) => setAppSubtitle(e.target.value)}
                      placeholder="Hospital System"
                      className="max-w-full sm:max-w-md h-8 sm:h-9 text-xs sm:text-sm"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Shown below the app name
                    </p>
                  </div>

                  <Button onClick={handleSaveAppSettings} className="mt-2 h-8 sm:h-9 text-xs sm:text-sm" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Program Settings */}
            <Card className="shadow-md">
              <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm lg:text-base font-semibold flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  Program Loyalitas
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Atur pengaturan poin loyalitas untuk member</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="loyaltyMinPurchase" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                      <Coins className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                      Minimum Pembelian untuk 1 Poin
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Rp</span>
                      <Input
                        id="loyaltyMinPurchase"
                        type="number"
                        value={loyaltyMinPurchase}
                        onChange={(e) => setLoyaltyMinPurchase(e.target.value)}
                        placeholder="10000"
                        className="max-w-full sm:max-w-xs h-8 sm:h-9 text-xs sm:text-sm"
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Pelanggan member akan mendapat 1 poin loyalitas setiap pembelian mencapai nilai ini.
                      <br />
                      <span className="text-primary font-medium">
                        Contoh: Jika diatur Rp 10.000, maka pembelian Rp 50.000 = 5 poin
                      </span>
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="loyaltyPointValue" className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                      <Gift className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                      Nilai Tukar 1 Poin
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Rp</span>
                      <Input
                        id="loyaltyPointValue"
                        type="number"
                        value={loyaltyPointValue}
                        onChange={(e) => setLoyaltyPointValue(e.target.value)}
                        placeholder="100"
                        className="max-w-full sm:max-w-xs h-8 sm:h-9 text-xs sm:text-sm"
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Nilai rupiah untuk setiap 1 poin saat ditukar di POS.
                      <br />
                      <span className="text-primary font-medium">
                        Contoh: Jika diatur Rp 100, maka 100 poin = Rp 10.000 potongan
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loyaltyMinRedeem" className="text-xs sm:text-sm font-medium">Minimal Poin untuk Ditukar</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="loyaltyMinRedeem"
                        type="number"
                        value={loyaltyMinRedeem}
                        onChange={(e) => setLoyaltyMinRedeem(e.target.value)}
                        placeholder="10"
                        className="max-w-full sm:max-w-xs h-8 sm:h-9 text-xs sm:text-sm"
                      />
                      <span className="text-xs sm:text-sm text-muted-foreground">poin</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Jumlah minimal poin yang harus dimiliki pelanggan untuk dapat menukarkan poin.
                    </p>
                  </div>

                  <Button onClick={handleSaveLoyaltySettings} className="mt-2 h-8 sm:h-9 text-xs sm:text-sm" disabled={loyaltyLoading}>
                    {loyaltyLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card className="shadow-md">
              <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm lg:text-base font-semibold">Appearance</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Choose theme</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-[10px] sm:text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                    <Moon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                    Theme
                  </Label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => handleThemeChange('light')}
                      className="h-16 sm:h-24 flex flex-col gap-1.5 sm:gap-2"
                    >
                      <Sun className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="text-xs sm:text-sm font-medium">Light</span>
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => handleThemeChange('dark')}
                      className="h-16 sm:h-24 flex flex-col gap-1.5 sm:gap-2"
                    >
                      <Moon className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span className="text-xs sm:text-sm font-medium">Dark</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card className="shadow-md">
              <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm lg:text-base font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-600" />
                  AI Assistant
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">
                  Konfigurasi Groq AI untuk fitur chat AI
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groqApiKey" className="text-xs sm:text-sm font-medium">
                      Groq API Key
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="groqApiKey"
                          type={showApiKey ? "text" : "password"}
                          value={groqApiKey}
                          onChange={(e) => setGroqApiKey(e.target.value)}
                          placeholder="gsk_..."
                          className="pr-10 h-8 sm:h-9 text-xs sm:text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Dapatkan API Key gratis di{" "}
                      <a 
                        href="https://console.groq.com/keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary underline hover:no-underline"
                      >
                        Groq Console
                      </a>
                    </p>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
                    <p className="font-medium">✨ Fitur AI Assistant:</p>
                    <ul className="text-muted-foreground list-disc list-inside space-y-0.5">
                      <li>Tanya data penjualan dengan bahasa natural</li>
                      <li>Cek produk dengan stok rendah</li>
                      <li>Lihat customer terbaik</li>
                      <li>Dan masih banyak lagi!</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleSaveAISettings} 
                    className="h-8 sm:h-9 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Save AI Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
