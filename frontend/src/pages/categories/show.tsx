import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar,
  Hash,
  Layers3,
  Image,
  Tag
} from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
  parent_id?: number;
  parent_category?: {
    id: number;
    name: string;
    code: string;
  };
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function CategoryShow() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    setPageTitle("Category Details");
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    if (!id) return;
    
    try {
      const response = await categoriesApi.getById(parseInt(id));
      setCategory(response.data.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to load category.",
      });
      navigate("/categories");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <p className="text-sm sm:text-base">Category not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/categories")}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Detail Kategori</CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Lihat informasi kategori
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Layers3 className="h-3 w-3" />
                  Nama
                </label>
                <p className="text-sm font-medium">{category.name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Kode
                </label>
                <p className="text-sm font-medium">{category.code}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Status
                </label>
                <Badge 
                  variant={category.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {category.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Layers3 className="h-3 w-3" />
                  Induk
                </label>
                <p className="text-xs sm:text-sm">
                  {category.parent_category 
                    ? `${category.parent_category.name}`
                    : '-'
                  }
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Dibuat
                </label>
                <p className="text-xs sm:text-sm">
                  {new Date(category.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Diupdate
                </label>
                <p className="text-xs sm:text-sm">
                  {new Date(category.updated_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {category.description && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Layers3 className="h-3 w-3" />
                  Deskripsi
                </label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
            )}

            {category.image_url && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Gambar
                </label>
                <img 
                  src={category.image_url} 
                  alt={category.name}
                  className="max-w-[150px] sm:max-w-xs max-h-32 sm:max-h-48 object-cover rounded-md border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                onClick={() => navigate("/categories")}
                size="sm"
                className="h-9 text-xs"
              >
                Kembali
              </Button>
              <Button
                onClick={() => navigate(`/categories/${category.id}/edit`)}
                size="sm"
                className="h-9 text-xs"
              >
                Edit Kategori
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
