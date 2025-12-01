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
import { suppliersApi } from "@/lib/api";
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

export default function SupplierCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    setPageTitle("Create Supplier");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await suppliersApi.create({
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Supplier created successfully.",
      });

      navigate("/suppliers");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error?.response?.data?.error || "Failed to create supplier.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate("/suppliers")}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">Create New Supplier</CardTitle>
                  <CardDescription className="text-xs hidden sm:block">Add a new supplier to your system</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-3 lg:gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Supplier Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter supplier name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">
                    Supplier Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Enter supplier code"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid gap-3 lg:gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Person</Label>
                  <div className="relative">
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="Enter contact person name"
                      className="pl-9"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="pl-9"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className="pl-9"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_number">Tax Number</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="Enter tax number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter complete address"
                    className="pl-9 min-h-[80px]"
                  />
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Business Information */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Popover open={paymentTermsOpen} onOpenChange={setPaymentTermsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {paymentTermsList.find((p) => p.value === formData.payment_terms)?.label || "Select payment terms"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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

                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Credit Limit</Label>
                  <div className="relative">
                    <Input
                      id="credit_limit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                      placeholder="0.00"
                      className="pl-9"
                    />
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {statusList.find((s) => s.value === formData.status)?.label || "Select status"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the supplier..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/suppliers")}
                  disabled={loading}
                  className="h-9 text-sm"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-9 text-sm">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Supplier
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
