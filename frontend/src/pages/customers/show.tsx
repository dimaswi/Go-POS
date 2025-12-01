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
import { customersApi, type Customer } from "@/lib/api";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar,
  Edit,
  Trash2,
  Loader2,
  Star,
  DollarSign,
  Clock,
  Crown
} from "lucide-react";
import { setPageTitle } from "@/lib/page-title";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function CustomerShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setPageTitle("Customer Details");
      loadCustomer();
    }
  }, [id]);

  const loadCustomer = async () => {
    try {
      const response = await customersApi.getById(parseInt(id!));
      setCustomer(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load customer data.",
      });
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      await customersApi.delete(customer.id);
      toast({
        variant: "success",
        title: "Success!",
        description: "Customer deleted successfully.",
      });
      navigate("/customers");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to delete customer.",
      });
    }
    setDeleteDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
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
            <span className="ml-2 text-xs sm:text-sm">Loading customer...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
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
                  onClick={() => navigate("/customers")}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${customer.is_member ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-primary/10'}`}>
                  {customer.is_member ? (
                    <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CardTitle className="text-sm font-semibold truncate">{customer.name}</CardTitle>
                    {customer.is_member && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-600 text-[10px] px-1">
                        <Crown className="h-2.5 w-2.5 mr-0.5" />
                        Member
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs hidden sm:block truncate">
                    {customer.email || "No email"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                  {customer.status}
                </Badge>
                {hasPermission('customers.update') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/customers/${customer.id}/edit`)}
                    className="h-8 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                {hasPermission('customers.delete') && (
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
                <h3 className="font-semibold text-xs">Personal Information</h3>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Name</p>
                      <p className="text-xs font-medium truncate">{customer.name}</p>
                    </div>
                  </div>

                  {customer.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <p className="text-xs font-medium truncate">{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Phone</p>
                        <p className="text-xs font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}

                  {customer.date_of_birth && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Date of Birth</p>
                        <p className="text-xs font-medium">{formatDate(customer.date_of_birth)}</p>
                      </div>
                    </div>
                  )}

                  {customer.gender && (
                    <div className="flex items-start gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Gender</p>
                        <p className="text-xs font-medium capitalize">{customer.gender}</p>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Address</p>
                        <p className="text-xs font-medium">{customer.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Loyalty & Stats */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs">Loyalty & Statistics</h3>
                
                {/* Member Card */}
                {customer.is_member && (
                  <Card className="p-2.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-700">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200 dark:bg-yellow-800 shrink-0">
                        <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-yellow-700 dark:text-yellow-400">Status</p>
                        <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300">Member Aktif</p>
                      </div>
                    </div>
                  </Card>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900 shrink-0">
                        <Star className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Points</p>
                        <p className="text-sm font-bold">{customer.loyalty_points.toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900 shrink-0">
                        <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Spent</p>
                        <p className="text-xs font-bold truncate">Rp {customer.total_spent.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {customer.last_visit && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Last Visit</p>
                      <p className="text-xs font-medium">{formatDateTime(customer.last_visit)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="truncate">Created: {formatDateTime(customer.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span className="truncate">Updated: {formatDateTime(customer.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
      />
    </div>
  );
}
