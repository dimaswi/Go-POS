import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { discountsApi, type Discount } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { setPageTitle } from '@/lib/page-title';
import { 
  Loader2, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DiscountsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      
      const response = await discountsApi.getAll(params);
      setDiscounts(response.data.data || []);
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.total_pages || 1);
        setTotalItems(response.data.pagination.total || 0);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data diskon.",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, toast]);

  useEffect(() => {
    setPageTitle('Diskon');
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  const confirmDelete = async () => {
    if (!discountToDelete) return;
    
    try {
      await discountsApi.delete(discountToDelete);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Diskon berhasil dihapus.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal menghapus diskon.",
      });
    }
    
    setDeleteDialogOpen(false);
    setDiscountToDelete(null);
  };

  const handleDelete = (id: number) => {
    setDiscountToDelete(id);
    setDeleteDialogOpen(true);
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
      return format(new Date(dateString), "dd MMM yyyy", { locale: id });
    } catch {
      return dateString;
    }
  };

  const getDiscountValue = (discount: Discount) => {
    if (discount.discount_type === 'percentage') {
      return `${discount.discount_value}%`;
    }
    return formatCurrency(discount.discount_value);
  };

  const isExpired = (discount: Discount) => {
    if (!discount.end_date) return false;
    return new Date(discount.end_date) < new Date();
  };

  if (loading && discounts.length === 0) {
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

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Diskon</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola diskon dan promo</CardDescription>
            </div>
            {hasPermission('sales.create') && (
              <Button onClick={() => navigate('/discounts/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1 min-w-0">
              <Input
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 h-8 text-xs"
              />
              <Button onClick={handleSearch} variant="secondary" size="icon" className="h-8 w-8">
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[120px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs whitespace-nowrap">Nama</TableHead>
                  <TableHead className="text-xs whitespace-nowrap hidden sm:table-cell">Kode</TableHead>
                  <TableHead className="text-xs whitespace-nowrap hidden sm:table-cell">Nilai</TableHead>
                  <TableHead className="text-xs whitespace-nowrap hidden md:table-cell">Penggunaan</TableHead>
                  <TableHead className="text-xs whitespace-nowrap hidden lg:table-cell">Periode</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Status</TableHead>
                  <TableHead className="w-[60px] text-center text-xs">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : discounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    discounts.map((discount) => (
                      <TableRow key={discount.id} className="hover:bg-muted/50">
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <p className="font-medium text-xs truncate max-w-[100px] sm:max-w-[150px]">{discount.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-2">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                            {discount.code || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-2">
                          <span className="text-xs font-semibold text-green-600">{getDiscountValue(discount)}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2">
                          <span className="text-xs">
                            <span className="font-medium">{discount.usage_count || 0}</span>
                            <span className="text-muted-foreground">
                              {discount.usage_limit > 0 ? ` / ${discount.usage_limit}` : ' / ∞'}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(discount.start_date)} - {formatDate(discount.end_date)}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          {!discount.is_active ? (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-[10px]">
                              Off
                            </Badge>
                          ) : isExpired(discount) ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 text-[10px]">
                              Exp
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px]">
                              On
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/discounts/${discount.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              {hasPermission('sales.update') && (
                                <DropdownMenuItem onClick={() => navigate(`/discounts/${discount.id}/edit`)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {hasPermission('sales.delete') && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(discount.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages} ({totalItems} diskon)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Diskon"
        description="Apakah Anda yakin ingin menghapus diskon ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
