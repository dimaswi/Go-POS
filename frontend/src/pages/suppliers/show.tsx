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
import { suppliersApi, type Supplier } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar,
  Edit,
  Trash2,
  Loader2,
  FileText,
  DollarSign
} from "lucide-react";
import { setPageTitle } from "@/lib/page-title";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function SupplierShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setPageTitle("Supplier Details");
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      const response = await suppliersApi.getById(parseInt(id!));
      setSupplier(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load supplier data.",
      });
      navigate("/suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;

    try {
      await suppliersApi.delete(supplier.id);
      toast({
        variant: "success",
        title: "Success!",
        description: "Supplier deleted successfully.",
      });
      navigate("/suppliers");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to delete supplier.",
      });
    }
    setDeleteDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-24 sm:h-32">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            <span className="ml-2 text-xs sm:text-sm">Loading supplier...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/suppliers")}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{supplier.name}</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Code: {supplier.code}</CardDescription>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                  {supplier.status}
                </Badge>
                {hasPermission('suppliers.update') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
                    className="h-8 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                {hasPermission('suppliers.delete') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive hover:text-destructive h-8 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs">Basic Information</h3>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Supplier Name</p>
                      <p className="text-xs font-medium truncate">{supplier.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Supplier Code</p>
                      <p className="text-xs font-medium">{supplier.code}</p>
                    </div>
                  </div>

                  {supplier.contact && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Contact Person</p>
                        <p className="text-xs font-medium">{supplier.contact}</p>
                      </div>
                    </div>
                  )}

                  {supplier.tax_number && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Tax Number</p>
                        <p className="text-xs font-medium">{supplier.tax_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs">Contact Information</h3>
                
                <div className="space-y-2">
                  {supplier.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Phone</p>
                        <p className="text-xs font-medium">{supplier.phone}</p>
                      </div>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <p className="text-xs font-medium truncate">{supplier.email}</p>
                      </div>
                    </div>
                  )}

                  {supplier.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Address</p>
                        <p className="text-xs font-medium">{supplier.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs">Business Information</h3>
                
                <div className="space-y-2">
                  {supplier.payment_terms && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Payment Terms</p>
                        <Badge variant="outline" className="text-[10px]">{supplier.payment_terms}</Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Credit Limit</p>
                      <p className="text-xs font-medium">
                        Rp {supplier.credit_limit.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs">Additional Information</h3>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Created At</p>
                      <p className="text-xs font-medium">
                        {formatDate(supplier.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Updated At</p>
                      <p className="text-xs font-medium">
                        {formatDate(supplier.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {supplier.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="font-semibold text-xs mb-2">Notes</h3>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs whitespace-pre-wrap">{supplier.notes}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description="Are you sure you want to delete this supplier? This action cannot be undone."
      />
    </div>
  );
}
