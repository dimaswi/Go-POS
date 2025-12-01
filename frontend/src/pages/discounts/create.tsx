import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { discountsApi, customersApi, type Customer } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { setPageTitle } from '@/lib/page-title';
import { ArrowLeft, Save, Loader2, Percent, Tag, Calendar, Users, Crown } from 'lucide-react';
import { format } from 'date-fns';

interface FormData {
  name: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount: number;
  applicable_to: 'all' | 'member' | 'specific_customer';
  customer_id: number | null;
  usage_limit: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function CreateDiscountPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase: 0,
    max_discount: 0,
    applicable_to: 'all',
    customer_id: null,
    usage_limit: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    setPageTitle('Tambah Diskon');
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await customersApi.getAll({ limit: 1000 });
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    handleChange('code', `DISC-${randomCode}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Nama diskon wajib diisi.",
      });
      return;
    }

    if (formData.discount_value <= 0) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Nilai diskon harus lebih dari 0.",
      });
      return;
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Persentase diskon tidak boleh lebih dari 100%.",
      });
      return;
    }

    if (formData.applicable_to === 'specific_customer' && !formData.customer_id) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Pilih pelanggan yang akan mendapat diskon.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        code: formData.code || undefined,
        description: formData.description || undefined,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_purchase: formData.min_purchase || 0,
        max_discount: formData.max_discount || undefined,
        applicable_to: formData.applicable_to,
        customer_id: formData.applicable_to === 'specific_customer' ? formData.customer_id : undefined,
        usage_limit: formData.usage_limit || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_active: formData.is_active,
      };

      await discountsApi.create(payload);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Diskon berhasil ditambahkan.",
      });
      navigate('/discounts');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal membuat diskon.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/50 p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Percent className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-sm lg:text-base font-semibold">Tambah Diskon</CardTitle>
                    <CardDescription className="text-xs lg:text-sm">
                      Buat diskon baru untuk penjualan
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/discounts')}
                    disabled={saving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Simpan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 lg:p-6">
              <div className="grid gap-3 lg:gap-4 sm:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Informasi Dasar
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Diskon *</Label>
                      <Input
                        id="name"
                        placeholder="Contoh: Diskon Kemerdekaan"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Kode Diskon</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          placeholder="Contoh: MERDEKA17"
                          value={formData.code}
                          onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={generateCode}>
                          Generate
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Kode yang digunakan pelanggan untuk mengklaim diskon
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        placeholder="Deskripsi singkat tentang diskon..."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Nilai Diskon
                    </h3>
                    
                    <div className="space-y-2">
                      <Label>Tipe Diskon *</Label>
                      <Select 
                        value={formData.discount_type} 
                        onValueChange={(v) => handleChange('discount_type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe diskon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Persentase (%)</SelectItem>
                          <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount_value">
                        Nilai Diskon * {formData.discount_type === 'percentage' ? '(%)' : '(Rp)'}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        min="0"
                        max={formData.discount_type === 'percentage' ? 100 : undefined}
                        placeholder={formData.discount_type === 'percentage' ? "10" : "10000"}
                        value={formData.discount_value || ''}
                        onChange={(e) => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_purchase">Minimum Pembelian (Rp)</Label>
                      <Input
                        id="min_purchase"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.min_purchase || ''}
                        onChange={(e) => handleChange('min_purchase', parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Kosongkan atau 0 jika tidak ada minimum
                      </p>
                    </div>

                    {formData.discount_type === 'percentage' && (
                      <div className="space-y-2">
                        <Label htmlFor="max_discount">Maksimum Diskon (Rp)</Label>
                        <Input
                          id="max_discount"
                          type="number"
                          min="0"
                          placeholder="50000"
                          value={formData.max_discount || ''}
                          onChange={(e) => handleChange('max_discount', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Batas maksimum potongan diskon (opsional)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Target Pelanggan
                    </h3>
                    
                    <div className="space-y-2">
                      <Label>Berlaku Untuk *</Label>
                      <Select 
                        value={formData.applicable_to} 
                        onValueChange={(v) => handleChange('applicable_to', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih target" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Pelanggan</SelectItem>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-yellow-500" />
                              Khusus Member
                            </div>
                          </SelectItem>
                          <SelectItem value="specific_customer">Pelanggan Tertentu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Member Discount Info Card */}
                    {formData.applicable_to === 'member' && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border border-yellow-200 dark:border-yellow-700">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-200 dark:bg-yellow-800 shrink-0">
                            <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-yellow-800 dark:text-yellow-300">Diskon Khusus Member</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              Diskon ini hanya berlaku untuk pelanggan yang memiliki status Member. 
                              Saat pelanggan member dipilih di POS, diskon ini akan otomatis diterapkan.
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                              Tip: Untuk mengaktifkan member, edit data pelanggan dan aktifkan toggle "Member Status"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.applicable_to === 'specific_customer' && (
                      <div className="space-y-2">
                        <Label>Pilih Pelanggan *</Label>
                        <Select 
                          value={formData.customer_id?.toString() || ''} 
                          onValueChange={(v) => handleChange('customer_id', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pelanggan" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingCustomers ? (
                              <SelectItem value="" disabled>
                                Memuat...
                              </SelectItem>
                            ) : (
                              customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name} {customer.phone && `(${customer.phone})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="usage_limit">Batas Penggunaan</Label>
                      <Input
                        id="usage_limit"
                        type="number"
                        min="0"
                        placeholder="Tidak terbatas"
                        value={formData.usage_limit || ''}
                        onChange={(e) => handleChange('usage_limit', parseInt(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Kosongkan atau 0 untuk penggunaan tak terbatas
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Periode Diskon
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Tanggal Mulai</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleChange('start_date', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_date">Tanggal Berakhir</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleChange('end_date', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Kosongkan jika tidak ada tanggal berakhir
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Status</h3>
                    
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_active">Aktifkan Diskon</Label>
                        <p className="text-xs text-muted-foreground">
                          Diskon yang aktif dapat digunakan saat transaksi
                        </p>
                      </div>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(v) => handleChange('is_active', v)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
