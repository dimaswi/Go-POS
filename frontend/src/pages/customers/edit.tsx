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
import { customersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, User, Mail, MapPin, Phone, Calendar, Check, ChevronsUpDown, Crown } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function CustomerEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [genderOpen, setGenderOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    status: "active",
    is_member: false,
  });

  useEffect(() => {
    setPageTitle("Edit Customer");
    if (id) {
      loadCustomer();
    }
  }, [id]);

  const loadCustomer = async () => {
    try {
      const response = await customersApi.getById(parseInt(id!));
      const customer = response.data.data;
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        date_of_birth: customer.date_of_birth 
          ? new Date(customer.date_of_birth).toISOString().split('T')[0] 
          : "",
        gender: customer.gender || "",
        status: customer.status || "active",
        is_member: customer.is_member || false,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load customer data.",
      });
      navigate("/customers");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
        status: formData.status,
        is_member: formData.is_member,
      };

      if (formData.date_of_birth) {
        payload.date_of_birth = new Date(formData.date_of_birth).toISOString();
      }

      await customersApi.update(parseInt(id!), payload);

      toast({
        variant: "success",
        title: "Success!",
        description: "Customer updated successfully.",
      });

      navigate("/customers");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error?.response?.data?.error || "Failed to update customer.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading customer...</span>
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
                size="icon"
                onClick={() => navigate("/customers")}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold">
                  Edit Customer
                </CardTitle>
                <CardDescription className="text-xs hidden sm:block">
                  Update customer information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-xs font-medium flex items-center gap-1.5"
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium flex items-center gap-1.5"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="date_of_birth"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date of Birth
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_birth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Gender
                  </Label>
                  <Popover open={genderOpen} onOpenChange={setGenderOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={genderOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.gender
                          ? genderOptions.find((g) => g.value === formData.gender)?.label
                          : "Select gender"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search gender..." />
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup>
                          {genderOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => {
                                setFormData({ ...formData, gender: option.value });
                                setGenderOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.gender === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Status
                  </Label>
                  <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statusOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.status
                          ? statusOptions.find((s) => s.value === formData.status)?.label
                          : "Select status"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search status..." />
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup>
                          {statusOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => {
                                setFormData({ ...formData, status: option.value });
                                setStatusOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.status === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter customer address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <div>
                    <Label htmlFor="is_member" className="font-medium">
                      Member Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to give member discounts
                    </p>
                  </div>
                </div>
                <Switch
                  id="is_member"
                  checked={formData.is_member}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_member: checked })
                  }
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/customers")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Customer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
