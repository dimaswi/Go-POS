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
import { Switch } from "@/components/ui/switch";
import { categoriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Layers3,
  Hash,
  Image,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

export default function CategoryCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<{ id: number; name: string; code: string }[]>([]);
  const [parentOpen, setParentOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent_id: "",
    image_url: "",
    status: "active",
  });

  useEffect(() => {
    setPageTitle("Create Category");
    loadParentCategories();
  }, []);

  const loadParentCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setParentCategories(response.data.data);
    } catch (error) {
      console.error("Failed to load parent categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await categoriesApi.create({
        ...formData,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Category created successfully.",
      });

      navigate("/categories");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to create category.",
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
                onClick={() => navigate("/categories")}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">Create Category</CardTitle>
                <CardDescription className="text-xs hidden sm:block">
                  Add a new category to organize products
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Layers3 className="h-4 w-4 text-muted-foreground" />
                  Category Name
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="code"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  Category Code
                </Label>
                <Input
                  id="code"
                  required
                  placeholder="Enter category code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Layers3 className="h-4 w-4 text-muted-foreground" />
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter category description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-muted-foreground" />
                  Parent Category
                </Label>
                <Popover open={parentOpen} onOpenChange={setParentOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {formData.parent_id ? parentCategories.find((c) => c.id.toString() === formData.parent_id)?.name || "Select parent category" : "Select parent category (optional)"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search parent category..." />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {parentCategories.map((category) => (
                          <CommandItem key={category.id} value={`${category.name} ${category.code}`} onSelect={() => { setFormData({ ...formData, parent_id: category.id.toString() }); setParentOpen(false); }}>
                            <Check className={`mr-2 h-4 w-4 ${formData.parent_id === category.id.toString() ? "opacity-100" : "opacity-0"}`} />
                            <div><div className="font-medium">{category.name}</div><div className="text-sm text-muted-foreground">{category.code}</div></div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="image_url"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Image className="h-4 w-4 text-muted-foreground" />
                  Image URL
                </Label>
                <Input
                  id="image_url"
                  placeholder="Enter image URL (optional)"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                id="status"
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, status: checked ? "active" : "inactive" })
                }
              />
              <Label htmlFor="status" className="text-sm font-medium">
                Active Category
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/categories")}
                disabled={loading}
                className="h-9 text-sm"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="h-9 text-sm">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Category
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
