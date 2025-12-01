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
import { Switch } from "@/components/ui/switch";
import { categoriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

export default function CategoryEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
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
    setPageTitle("Edit Category");
    loadParentCategories();
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    if (!id) return;
    
    try {
      const response = await categoriesApi.getById(parseInt(id));
      const category = response.data.data;
      
      setFormData({
        name: category.name || "",
        code: category.code || "",
        description: category.description || "",
        parent_id: category.parent_id ? category.parent_id.toString() : "",
        image_url: category.image_url || "",
        status: category.status || "active",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to load category.",
      });
      navigate("/categories");
    } finally {
      setPageLoading(false);
    }
  };

  const loadParentCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setParentCategories(response.data.data.filter((cat: any) => cat.id.toString() !== id));
    } catch (error) {
      console.error("Failed to load parent categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);

    try {
      await categoriesApi.update(parseInt(id), {
        ...formData,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Category updated successfully.",
      });

      navigate("/categories");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to update category.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
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
              <CardTitle className="text-sm font-semibold truncate">Edit Kategori</CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Update informasi kategori
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
                  Nama Kategori
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Masukkan nama kategori"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="code"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Kode Kategori
                </Label>
                <Input
                  id="code"
                  required
                  placeholder="Masukkan kode kategori"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-medium flex items-center gap-2"
              >
                <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
                Deskripsi
              </Label>
              <Textarea
                id="description"
                placeholder="Masukkan deskripsi kategori"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[70px] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
                  Kategori Induk
                </Label>
                <Popover open={parentOpen} onOpenChange={setParentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={parentOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.parent_id
                        ? parentCategories.find(
                            (c) => c.id.toString() === formData.parent_id
                          )?.name || "Select parent category (optional)"
                        : "Select parent category (optional)"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {parentCategories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={`${category.name} ${category.code}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                parent_id: category.id.toString(),
                              });
                              setParentOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.parent_id === category.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {category.name} ({category.code})
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
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  URL Gambar
                </Label>
                <Input
                  id="image_url"
                  placeholder="URL gambar (opsional)"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, status: checked ? "active" : "inactive" })
                }
              />
              <Label htmlFor="status" className="text-xs font-medium">
                Kategori Aktif
              </Label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/categories")}
                disabled={loading}
                size="sm"
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="h-9 text-xs">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Kategori
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
