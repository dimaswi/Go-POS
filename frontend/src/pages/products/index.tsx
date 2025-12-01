import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { productsApi } from "@/lib/api";
import { createProductColumns } from "./columns";
import type { Product } from "./columns";
import { setPageTitle } from "@/lib/page-title";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function ProductsIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const search = "";
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    product: Product | null;
    loading: boolean;
  }>({
    open: false,
    product: null,
    loading: false,
  });

  useEffect(() => {
    setPageTitle("Manajemen Produk");
    loadProducts();
  }, [pagination.page, pagination.limit, search]);

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });

      setProducts(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.total_pages || 1,
      }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memuat produk.",
      });
    }
  };

  const handleView = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  const handleEdit = (product: Product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDelete = (product: Product) => {
    setDeleteDialog({
      open: true,
      product,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.product) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await productsApi.delete(deleteDialog.product.id);

      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Produk berhasil dihapus.",
      });

      setDeleteDialog({ open: false, product: null, loading: false });
      loadProducts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus produk.",
      });
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = createProductColumns(handleView, handleEdit, handleDelete);

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                Produk
              </CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Kelola data produk
              </CardDescription>
            </div>
            <Button
              onClick={() => navigate("/products/create")}
              size="sm"
              className="h-8 text-xs shrink-0"
            >
              <Plus className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Tambah</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={products} 
            mobileHiddenColumns={["sku", "category", "unit", "cost_price", "selling_price", "is_active", "created_at", "select"]}
            serverPagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: (newPage) => setPagination(prev => ({ ...prev, page: newPage }))
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !deleteDialog.loading &&
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
        title="Hapus Produk"
        description={`Apakah Anda yakin ingin menghapus produk "${deleteDialog.product?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
