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
import { Separator } from "@/components/ui/separator";
import { productsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Package,
  Barcode,
  Layers3,
  Ruler,
  DollarSign,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { setPageTitle } from "@/lib/page-title";
import type { Product } from "./columns";

export default function ProductShow() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    setPageTitle("Product Details");
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      const response = await productsApi.getById(parseInt(id));
      setProduct(response.data.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to load product.",
      });
      navigate("/products");
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

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <div className="text-center px-4">
          <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-sm sm:text-lg font-semibold">Product not found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">The requested product could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/products")}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">
                  Detail Produk
                </CardTitle>
                <CardDescription className="text-xs hidden sm:block">
                  Informasi lengkap produk
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/products/${product.id}/edit`)}
              size="sm"
              className="h-8 text-xs shrink-0"
            >
              <Edit className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid gap-4 sm:gap-6">
              {/* Basic Information */}
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs sm:text-sm font-medium">Informasi Dasar</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Nama Produk
                    </p>
                    <p className="text-sm font-semibold">{product.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      SKU
                    </p>
                    <p className="text-xs sm:text-sm">{product.sku}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Barcode className="h-3 w-3" />
                      Barcode
                    </p>
                    <p className="text-xs sm:text-sm">{product.barcode || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Layers3 className="h-3 w-3" />
                      Kategori
                    </p>
                    {product.category ? (
                      <Badge variant="secondary" className="text-xs">
                        {product.category.name}
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground">-</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      Satuan
                    </p>
                    <p className="text-xs sm:text-sm">{product.unit}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                      className={`text-xs ${product.is_active ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                    >
                      {product.is_active ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {product.description && (
                <>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-xs sm:text-sm font-medium">Deskripsi</h3>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                        {product.description}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Pricing & Stock */}
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs sm:text-sm font-medium">Harga & Stok</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Harga Beli</p>
                    <p className="text-xs sm:text-sm font-semibold">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(product.cost_price)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Harga Jual</p>
                    <p className="text-xs sm:text-sm font-semibold">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(product.selling_price)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Min</p>
                    <p className="text-xs sm:text-sm">{product.min_stock.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Max</p>
                    <p className="text-xs sm:text-sm">
                      {product.max_stock ? product.max_stock.toLocaleString() : "∞"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs sm:text-sm font-medium">Pengaturan</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Trackable</span>
                    <Badge variant={product.is_trackable ? "default" : "secondary"} className={`text-xs ${product.is_trackable ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}>
                      {product.is_trackable ? "Ya" : "Tidak"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Status</span>
                    <Badge variant={product.is_active ? "default" : "secondary"} className={`text-xs ${product.is_active ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}>
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Meta Information */}
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs sm:text-sm font-medium">Info</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Dibuat</p>
                    <p className="text-xs sm:text-sm">
                      {format(new Date(product.created_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Diupdate</p>
                    <p className="text-xs sm:text-sm">
                      {format(new Date(product.updated_at), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
