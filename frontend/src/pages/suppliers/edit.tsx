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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { suppliersApi, type Supplier } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Building2, Mail, MapPin, Phone, CreditCard, Check, ChevronsUpDown } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

const paymentTermsList = [
  { value: "COD", label: "Cash on Delivery (COD)" },
  { value: "Net 7", label: "Net 7 Days" },
  { value: "Net 15", label: "Net 15 Days" },
  { value: "Net 30", label: "Net 30 Days" },
  { value: "Net 45", label: "Net 45 Days" },
  { value: "Net 60", label: "Net 60 Days" },
];

const statusList = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function SupplierEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [paymentTermsOpen, setPaymentTermsOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    tax_number: "",
    status: "active",
    payment_terms: "",
    credit_limit: "0",
    notes: "",
  });

  useEffect(() => {
    if (id) {
      setPageTitle("Edit Supplier");
      loadSupplier();
    }
  }, [id]);

  const loadSupplier = async () => {
    try {
      const response = await suppliersApi.getById(parseInt(id!));
      const supplier: Supplier = response.data.data;
      
      setFormData({
        name: supplier.name,
        code: supplier.code,
        contact: supplier.contact || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        tax_number: supplier.tax_number || "",
        status: supplier.status,
        payment_terms: supplier.payment_terms || "",
        credit_limit: supplier.credit_limit.toString(),
        notes: supplier.notes || "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load supplier data.",
      });
      navigate("/suppliers");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await suppliersApi.update(parseInt(id!), {
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Supplier updated successfully.",
      });

      navigate("/suppliers");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error?.response?.data?.error || "Failed to update supplier.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading supplier...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/suppliers")}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold">Edit Supplier</CardTitle>
                  <CardDescription className="text-xs hidden sm:block">Update supplier information</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Supplier Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter supplier name"
                    required
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs">
                    Supplier Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Enter supplier code"
                    required
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact" className="text-xs">Contact Person</Label>
                  <div className="relative">
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="Enter contact person name"
                      className="pl-8 h-8 text-sm"
                    />
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="pl-8 h-8 text-sm"
                    />
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className="pl-8 h-8 text-sm"
                    />
                    <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tax_number" className="text-xs">Tax Number</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="Enter tax number"
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs">Address</Label>
                <div className="relative">
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter complete address"
                    className="pl-8 min-h-[70px] text-sm"
                  />
                  <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Business Information */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="payment_terms" className="text-xs">Payment Terms</Label>
                  <Popover open={paymentTermsOpen} onOpenChange={setPaymentTermsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-8 text-sm">
                        {paymentTermsList.find((p) => p.value === formData.payment_terms)?.label || "Select payment terms"}
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search payment terms..." />
                        <CommandEmpty>No payment terms found.</CommandEmpty>
                        <CommandGroup>
                          {paymentTermsList.map((term) => (
                            <CommandItem key={term.value} value={term.label} onSelect={() => { setFormData({ ...formData, payment_terms: term.value }); setPaymentTermsOpen(false); }}>
                              <Check className={`mr-2 h-4 w-4 ${formData.payment_terms === term.value ? "opacity-100" : "opacity-0"}`} />
                              {term.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="credit_limit" className="text-xs">Credit Limit</Label>
                  <div className="relative">
                    <Input
                      id="credit_limit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      placeholder="0.00"
                      className="pl-8 h-8 text-sm"
                    />
                    <CreditCard className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs">Status</Label>
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between h-8 text-sm">
                      {statusList.find((s) => s.value === formData.status)?.label || "Select status"}
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search status..." />
                      <CommandEmpty>No status found.</CommandEmpty>
                      <CommandGroup>
                        {statusList.map((status) => (
                          <CommandItem key={status.value} value={status.label} onSelect={() => { setFormData({ ...formData, status: status.value }); setStatusOpen(false); }}>
                            <Check className={`mr-2 h-4 w-4 ${formData.status === status.value ? "opacity-100" : "opacity-0"}`} />
                            {status.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the supplier..."
                  className="min-h-[70px] text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/suppliers")}
                  disabled={loading}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-8 text-xs">
                  {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Update Supplier
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
