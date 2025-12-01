import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { discountsApi, type Discount } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { setPageTitle } from '@/lib/page-title';
import { 
  ArrowLeft, 
  Loader2, 
  Percent, 
  Tag, 
  Calendar, 
  Users,
  Pencil,
  Hash,
  Wallet,
  Target,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function ShowDiscountPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageTitle('Detail Diskon');
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await discountsApi.getById(parseInt(id));
      setDiscount(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data diskon.",
      });
      navigate('/discounts');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const getDiscountValue = (d: Discount) => {
    if (d.discount_type === 'percentage') {
      return `${d.discount_value}%`;
    }
    return formatCurrency(d.discount_value);
  };

  const getApplicableToLabel = (value: string) => {
    switch (value) {
      case 'all': return 'Semua Pelanggan';
      case 'member': return 'Khusus Member';
      case 'specific_customer': return 'Pelanggan Tertentu';
      default: return value;
    }
  };

  const isExpired = (d: Discount) => {
    if (!d.end_date) return false;
    return new Date(d.end_date) < new Date();
  };

  const isNotStarted = (d: Discount) => {
    if (!d.start_date) return false;
    return new Date(d.start_date) > new Date();
  };

  const getStatus = (d: Discount) => {
    if (!d.is_active) return { label: 'Nonaktif', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
    if (isExpired(d)) return { label: 'Expired', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
    if (isNotStarted(d)) return { label: 'Belum Mulai', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Aktif', variant: 'default' as const, color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat data diskon...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!discount) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <span className="text-muted-foreground">Diskon tidak ditemukan</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getStatus(discount);

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/discounts')}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Percent className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">{discount.name}</CardTitle>
                  <CardDescription className="text-xs hidden sm:block">
                    Detail informasi diskon
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                {hasPermission('sales.update') && (
                  <Button size="sm" onClick={() => navigate(`/discounts/${id}/edit`)} className="h-8 text-xs">
                    <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-xs sm:text-sm">
                    <Tag className="h-4 w-4 text-primary" />
                    Informasi Dasar
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Nama Diskon</p>
                        <p className="text-xs sm:text-sm font-medium truncate">{discount.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Kode Diskon</p>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                          {discount.code || '-'}
                        </code>
                      </div>
                    </div>

                    {discount.description && (
                      <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Deskripsi</p>
                          <p className="text-xs sm:text-sm">{discount.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-xs sm:text-sm">
                    <Percent className="h-4 w-4 text-primary" />
                    Nilai Diskon
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Percent className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Tipe Diskon</p>
                        <Badge variant="outline" className="text-[10px]">
                          {discount.discount_type === 'percentage' ? 'Persentase' : 'Nominal Tetap'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                      <Wallet className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Nilai Diskon</p>
                        <p className="font-bold text-sm sm:text-lg text-green-600">
                          {getDiscountValue(discount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Wallet className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Minimum Pembelian</p>
                        <p className="text-xs sm:text-sm font-medium">
                          {discount.min_purchase > 0 ? formatCurrency(discount.min_purchase) : 'Tidak ada'}
                        </p>
                      </div>
                    </div>

                    {discount.discount_type === 'percentage' && discount.max_discount > 0 && (
                      <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                        <Target className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Maksimum Diskon</p>
                          <p className="text-xs sm:text-sm font-medium">{formatCurrency(discount.max_discount)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-xs sm:text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    Target & Penggunaan
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Users className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Berlaku Untuk</p>
                        <p className="text-xs sm:text-sm font-medium">{getApplicableToLabel(discount.applicable_to)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Penggunaan</p>
                        <p className="text-xs sm:text-sm font-medium">
                          {discount.usage_count} / {discount.usage_limit || '∞'} kali
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    Periode Diskon
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Tanggal Mulai</p>
                        <p className="text-xs sm:text-sm font-medium">{formatDate(discount.start_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 sm:p-3 bg-muted/30 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Tanggal Berakhir</p>
                        <p className="text-xs sm:text-sm font-medium">{formatDate(discount.end_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-xs sm:text-sm">
                    {discount.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Status
                  </h3>
                  
                  <div className="flex items-start gap-2 p-2 sm:p-3 rounded-lg border-2" style={{
                    borderColor: status.label === 'Aktif' ? '#22c55e' : 
                                 status.label === 'Nonaktif' ? '#9ca3af' :
                                 status.label === 'Expired' ? '#ef4444' : '#eab308'
                  }}>
                    <Badge className={`${status.color} text-[10px]`}>
                      {status.label}
                    </Badge>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {status.label === 'Aktif' && 'Diskon ini dapat digunakan saat transaksi'}
                      {status.label === 'Nonaktif' && 'Diskon ini dinonaktifkan dan tidak dapat digunakan'}
                      {status.label === 'Expired' && 'Periode diskon telah berakhir'}
                      {status.label === 'Belum Mulai' && 'Periode diskon belum dimulai'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
