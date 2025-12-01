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
import { usePermission } from "@/hooks/usePermission";
import { Plus, Loader2 } from "lucide-react";
import { categoriesApi } from "@/lib/api";
import { createCategoryColumns, type Category } from "./columns";
import { setPageTitle } from "@/lib/page-title";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function CategoriesIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    setPageTitle("Categories Management");
    loadCategories();
  }, []);

  const loadCategories = async (page = 1) => {
    setLoading(true);
    try {
      const response = await categoriesApi.getAll({ page, limit: pagination.limit });
      setCategories(response.data.data || []);
      if (response.data.pagination) {
        setPagination({
          page: response.data.pagination.current_page || page,
          limit: response.data.pagination.per_page || 10,
          total: response.data.pagination.total || 0,
          totalPages: response.data.pagination.total_pages || 1,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to load categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoryId: number) => {
    navigate(`/categories/${categoryId}/edit`);
  };

  const handleView = (categoryId: number) => {
    navigate(`/categories/${categoryId}`);
  };

  const handleDelete = (categoryId: number) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await categoriesApi.delete(categoryToDelete);
      
      toast({
        variant: "success",
        title: "Success!",
        description: "Category deleted successfully.",
      });
      
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete category.",
      });
    }
  };

  const columns = createCategoryColumns({ onEdit: handleEdit, onDelete: handleDelete, onView: handleView });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Kategori</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola kategori produk</CardDescription>
            </div>
            {hasPermission('products.create') && (
              <Button onClick={() => navigate('/categories/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={categories}
            searchPlaceholder="Cari..."
            mobileHiddenColumns={["code", "description", "created_at", "select"]}
            serverPagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: (newPage) => loadCategories(newPage)
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
