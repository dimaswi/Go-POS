import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  inventoryApi,
  customersApi, 
  storesApi, 
  salesApi,
  discountsApi,
  settingsApi,
  type Product,
  type Customer,
  type Store,
  type StoreInventory,
  type Sale,
  type Discount
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReceiptPrintDialog } from "@/components/ReceiptPrint";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X,
  User,
  ShoppingCart,
  CreditCard,
  Banknote,
  Wallet,
  Check,
  ChevronsUpDown,
  ArrowLeft,
  Calculator,
  Receipt,
  Loader2,
  Store as StoreIcon,
  Percent,
  Tag,
  Crown,
  Gift,
  Coins
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  availableStock: number;
}

interface ProductWithStock extends Product {
  available_stock: number;
}

const paymentMethods = [
  { value: "cash", label: "Tunai", icon: Banknote },
  { value: "card", label: "Kartu", icon: CreditCard },
  { value: "digital_wallet", label: "E-Wallet", icon: Wallet },
];

export default function POSPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin (can access all stores)
  const isAdmin = user?.role?.name?.toLowerCase().includes('admin') || 
                  user?.role?.name?.toLowerCase().includes('super') ||
                  user?.role?.name?.toLowerCase().includes('owner') ||
                  user?.role?.name?.toLowerCase().includes('manager');

  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Popover states
  const [customerOpen, setCustomerOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  // Receipt dialog
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Discount states
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  // Tax states
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(11); // 11% default PPN

  // Loyalty points states
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointValue, setPointValue] = useState(100); // 1 point = Rp 100 default
  const [loyaltyMinPurchase, setLoyaltyMinPurchase] = useState(10000); // Min purchase for 1 point
  const [loyaltyMinRedeem, setLoyaltyMinRedeem] = useState(10); // Min points to redeem

  // State for mobile cart visibility
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Calculate discount amount
  const calculateDiscountAmount = useCallback(() => {
    if (!selectedDiscount) return 0;
    
    const baseAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Check min purchase
    if (selectedDiscount.min_purchase > 0 && baseAmount < selectedDiscount.min_purchase) {
      return 0;
    }
    
    let discountAmt = 0;
    if (selectedDiscount.discount_type === 'percentage') {
      discountAmt = baseAmount * (selectedDiscount.discount_value / 100);
      // Apply max discount cap if set
      if (selectedDiscount.max_discount > 0 && discountAmt > selectedDiscount.max_discount) {
        discountAmt = selectedDiscount.max_discount;
      }
    } else {
      discountAmt = selectedDiscount.discount_value;
    }
    
    return discountAmt;
  }, [selectedDiscount, cart]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = taxEnabled ? subtotal * (taxRate / 100) : 0;
  const discountAmount = calculateDiscountAmount();
  
  // Calculate points redemption value
  const pointsRedemptionValue = usePoints ? pointsToRedeem * pointValue : 0;
  
  const totalBeforePoints = subtotal + taxAmount - discountAmount;
  const totalAmount = Math.max(0, totalBeforePoints - pointsRedemptionValue);
  const changeAmount = parseFloat(paidAmount || "0") - totalAmount;

  // Calculate points that will be earned from this transaction (based on total after discount)
  const pointsToEarn = selectedCustomer?.is_member 
    ? Math.floor(totalBeforePoints / loyaltyMinPurchase) 
    : 0;

  // Max points that can be redeemed (can't exceed total or customer's points)
  const maxRedeemablePoints = selectedCustomer?.is_member 
    ? Math.min(
        selectedCustomer.loyalty_points || 0,
        Math.floor(totalBeforePoints / pointValue)
      )
    : 0;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Focus search on load
  useEffect(() => {
    if (!loading && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading]);

  const loadData = async () => {
    try {
      const [customersRes, storesRes, discountsRes, settingsRes] = await Promise.all([
        customersApi.getAll({ status: "active" }),
        storesApi.getAll(),
        discountsApi.getActive(),
        settingsApi.getAll(),
      ]);
      setCustomers(customersRes.data.data || []);
      setStores(storesRes.data.data || []);
      setDiscounts(discountsRes.data.data || []);
      
      // Load loyalty settings
      const settings = settingsRes.data.data || {};
      if (settings.loyalty_min_purchase) {
        setLoyaltyMinPurchase(parseFloat(settings.loyalty_min_purchase) || 10000);
      }
      if (settings.loyalty_point_value) {
        setPointValue(parseFloat(settings.loyalty_point_value) || 100);
      }
      if (settings.loyalty_min_redeem) {
        setLoyaltyMinRedeem(parseFloat(settings.loyalty_min_redeem) || 10);
      }
      
      // If user has assigned store, use it (locked)
      if (user?.store_id && user?.store) {
        setSelectedStore(user.store);
      }
      // Otherwise, set default store if only one
      else if (storesRes.data.data?.length === 1) {
        setSelectedStore(storesRes.data.data[0]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load data.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load products when store changes
  const loadStoreProducts = async (storeId: number) => {
    setLoadingProducts(true);
    setProducts([]);
    try {
      const response = await inventoryApi.getStoreInventory({ store_id: storeId, limit: 1000 });
      const inventory = response.data.data || [];
      
      // Transform store inventory to products with stock
      const productsWithStock: ProductWithStock[] = inventory
        .filter((inv: StoreInventory) => inv.product && inv.quantity > 0)
        .map((inv: StoreInventory) => ({
          ...inv.product!,
          available_stock: inv.quantity - inv.reserved_quantity,
        }));
      
      setProducts(productsWithStock);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load store products.",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Effect to load products when store is selected
  useEffect(() => {
    if (selectedStore) {
      loadStoreProducts(selectedStore.id);
      setCart([]); // Clear cart when store changes
    } else {
      setProducts([]);
    }
  }, [selectedStore]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = useCallback((product: ProductWithStock) => {
    const availableStock = product.available_stock || 0;
    
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      
      if (existingIndex >= 0) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty >= availableStock) {
          toast({
            variant: "destructive",
            title: "Batas Stok!",
            description: `Hanya ${availableStock} item tersedia di stok.`,
          });
          return prev;
        }
        
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        updated[existingIndex].totalPrice = 
          updated[existingIndex].quantity * updated[existingIndex].unitPrice - 
          updated[existingIndex].discountAmount;
        return updated;
      }
      
      if (availableStock <= 0) {
        toast({
          variant: "destructive",
          title: "Stok Habis!",
          description: `${product.name} tidak tersedia.`,
        });
        return prev;
      }
      
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.selling_price,
          discountAmount: 0,
          totalPrice: product.selling_price,
          availableStock: availableStock,
        },
      ];
    });
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, [toast]);

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = Math.max(0, item.quantity + delta);
            
            // Check stock limit when increasing
            if (delta > 0 && newQuantity > item.availableStock) {
              toast({
                variant: "destructive",
                title: "Batas Stok!",
                description: `Hanya ${item.availableStock} item tersedia.`,
              });
              return item;
            }
            
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice - item.discountAmount,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setSelectedDiscount(null);
    setNotes("");
    setUsePoints(false);
    setPointsToRedeem(0);
  };

  const handlePayment = () => {
    if (!selectedStore) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Silakan pilih toko terlebih dahulu.",
      });
      return;
    }
    
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Keranjang kosong.",
      });
      return;
    }
    
    setPaidAmount(totalAmount.toFixed(0));
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedStore || !user) return;
    
    const paid = parseFloat(paidAmount || "0");
    if (paid < totalAmount) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Paid amount is less than total.",
      });
      return;
    }

    setProcessing(true);
    
    try {
      const saleData = {
        store_id: selectedStore.id,
        customer_id: selectedCustomer?.id || undefined,
        discount_id: selectedDiscount?.id || undefined,
        points_redeemed: usePoints ? pointsToRedeem : 0,
        points_redemption_value: pointsRedemptionValue,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.discountAmount,
          total_price: item.totalPrice,
        })),
        payments: [
          {
            payment_method: paymentMethod,
            amount: paid,
            status: "completed",
          },
        ],
        discount_amount: discountAmount + pointsRedemptionValue,
        tax_amount: taxAmount,
        notes: notes || undefined,
      };

      const response = await salesApi.create(saleData);
      const createdSaleId = response.data.data?.id;

      toast({
        variant: "success",
        title: "Payment Successful!",
        description: `Change: Rp ${(paid - totalAmount).toLocaleString('id-ID')}`,
      });

      setPaymentDialogOpen(false);
      
      // Fetch full sale data for receipt printing
      if (createdSaleId) {
        try {
          const saleResponse = await salesApi.getById(createdSaleId);
          setLastSale(saleResponse.data.data);
          setReceiptDialogOpen(true);
        } catch {
          console.error("Failed to fetch sale for receipt");
        }
      }
      
      clearCart();
      setPaidAmount("");
      setPaymentMethod("cash");
      
      // Reload products to update stock after successful sale
      if (selectedStore) {
        loadStoreProducts(selectedStore.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment Failed!",
        description: error?.response?.data?.error || "Failed to process payment.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    );
  }

  // If user is not admin and has no assigned store, show assignment required page
  if (!isAdmin && !user?.store_id) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="p-4 lg:p-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
                <StoreIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Toko Belum Ditentukan</h2>
              <p className="text-muted-foreground mb-6">
                Anda belum di-assign ke toko manapun. Silakan hubungi administrator untuk mengatur toko Anda.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Dashboard
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Admin dapat mengatur toko di menu <strong>Users → Edit User</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-muted/30">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col p-3 lg:p-4 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Kasir</h1>
              <p className="text-xs lg:text-sm text-muted-foreground">
                {user?.full_name || user?.username}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* History Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/pos/history")}
              className="h-9"
            >
              <Receipt className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
            
            {/* Store Selector */}
            {user?.store_id ? (
              // User has assigned store - show locked indicator
              <div className="flex items-center gap-2 px-2 lg:px-3 py-2 border rounded-md bg-muted/50 text-sm">
                <StoreIcon className="h-4 w-4 text-primary" />
                <span className="font-medium truncate max-w-[120px] lg:max-w-none">{selectedStore?.name || 'Loading...'}</span>
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">Toko Anda</Badge>
              </div>
            ) : isAdmin ? (
              // Admin without assigned store - allow selection with indicator
              <>
              <Popover open={storeOpen} onOpenChange={setStoreOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={storeOpen}
                  className="w-[180px] lg:w-[250px] justify-between h-9"
                  size="sm"
                >
                  <StoreIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{selectedStore ? selectedStore.name : "Pilih toko..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput placeholder="Cari toko..." />
                  <CommandList>
                    <CommandEmpty>Toko tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {stores.map((store) => (
                        <CommandItem
                          key={store.id}
                          value={store.name}
                          onSelect={() => {
                            setSelectedStore(store);
                            setStoreOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStore?.id === store.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {store.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Badge variant="outline" className="hidden sm:inline-flex">Admin</Badge>
            </>
            ) : null}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 lg:h-12 text-base lg:text-lg"
          />
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1">
          {!selectedStore ? (
            <div className="text-center py-8 lg:py-12">
              <StoreIcon className="h-10 lg:h-12 w-10 lg:w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground text-sm lg:text-base">Silakan pilih toko terlebih dahulu</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Produk akan muncul berdasarkan inventori toko</p>
            </div>
          ) : loadingProducts ? (
            <div className="text-center py-8 lg:py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-muted-foreground">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <ShoppingCart className="h-10 lg:h-12 w-10 lg:w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground text-sm lg:text-base">
                {searchQuery ? "Produk tidak ditemukan" : "Tidak ada produk di toko ini"}
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">
                {searchQuery ? "Coba kata kunci pencarian lain" : "Tambahkan produk ke inventori toko terlebih dahulu"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3 pb-20 lg:pb-0">
              {filteredProducts.map((product) => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const cartQty = cartItem?.quantity || 0;
                const remainingStock = (product.available_stock || 0) - cartQty;
                const isLowStock = remainingStock <= 5;
                const isOutOfStock = remainingStock <= 0;
                
                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isOutOfStock 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover:border-primary",
                      cartQty > 0 && "border-primary bg-primary/5"
                    )}
                    onClick={() => !isOutOfStock && addToCart(product)}
                  >
                    <CardContent className="p-2 lg:p-3">
                      <div className="aspect-square bg-muted rounded-md mb-1 lg:mb-2 flex items-center justify-center relative">
                        <ShoppingCart className="h-6 lg:h-8 w-6 lg:w-8 text-muted-foreground" />
                        {cartQty > 0 && (
                          <Badge className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 h-5 w-5 lg:h-6 lg:w-6 flex items-center justify-center p-0 text-xs">
                            {cartQty}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-xs lg:text-sm truncate">{product.name}</h3>
                      <p className="text-[10px] lg:text-xs text-muted-foreground truncate">{product.sku}</p>
                      <p className="font-bold text-primary mt-1 text-xs lg:text-sm">
                        Rp {(product.selling_price || 0).toLocaleString('id-ID')}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={cn(
                          "text-[10px] lg:text-xs",
                          isOutOfStock ? "text-destructive" : isLowStock ? "text-orange-500" : "text-muted-foreground"
                        )}>
                          Stock: {remainingStock}
                        </span>
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-[8px] lg:text-[10px] px-1">
                            Out
                          </Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <Badge variant="outline" className="text-[8px] lg:text-[10px] px-1 text-orange-500 border-orange-500">
                            Low
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Mobile Cart Toggle Button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button
            size="lg"
            onClick={() => setShowMobileCart(true)}
            className="h-14 w-14 rounded-full shadow-lg relative"
          >
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel - Cart (Desktop) */}
      <div className="hidden lg:flex w-[400px] bg-background border-l flex-col">
        {/* Customer Selector */}
        <div className="p-4 border-b">
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={customerOpen}
                className="w-full justify-between"
              >
                <User className="mr-2 h-4 w-4" />
                {selectedCustomer ? selectedCustomer.name : "Pelanggan Umum"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[368px] p-0">
              <Command>
                <CommandInput placeholder="Cari pelanggan..." />
                <CommandList>
                  <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="walk-in"
                      onSelect={() => {
                        setSelectedCustomer(null);
                        setCustomerOpen(false);
                        // Reset points and discount when switching to walk-in customer
                        setUsePoints(false);
                        setPointsToRedeem(0);
                        setSelectedDiscount(null);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !selectedCustomer ? "opacity-100" : "opacity-0"
                        )}
                      />
                      Pelanggan Umum
                    </CommandItem>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.name} ${customer.phone || ""}`}
                        onSelect={() => {
                          setSelectedCustomer(customer);
                          setCustomerOpen(false);
                          
                          // Reset points and discount when changing customer
                          setUsePoints(false);
                          setPointsToRedeem(0);
                          setSelectedDiscount(null);
                          
                          // Auto-apply member discount if customer is member
                          if (customer.is_member) {
                            const memberDiscount = discounts.find(d => d.applicable_to === 'member' && d.is_active);
                            if (memberDiscount) {
                              setSelectedDiscount(memberDiscount);
                              toast({
                                title: "Diskon Member!",
                                description: `Diskon ${memberDiscount.name} diterapkan otomatis.`,
                              });
                            }
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {customer.name}
                            {customer.is_member && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">
                                <Crown className="h-2.5 w-2.5 mr-0.5" />
                                Member
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {customer.phone && <span>{customer.phone}</span>}
                            {customer.is_member && (
                              <span className="ml-2">• {customer.loyalty_points || 0} poin</span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {/* Member Info Card */}
          {selectedCustomer && selectedCustomer.is_member && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Member Aktif</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Poin:</span>
                  <span className="ml-1 font-semibold text-amber-700 dark:text-amber-400">{selectedCustomer.loyalty_points || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Belanja:</span>
                  <span className="ml-1 font-semibold">Rp {(selectedCustomer.total_spent || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
              {selectedDiscount?.applicable_to === 'member' && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                    <Percent className="h-3 w-3" />
                    <span>Diskon {selectedDiscount.name} aktif</span>
                  </div>
                </div>
              )}
              {/* Points Redemption Section */}
              {maxRedeemablePoints >= loyaltyMinRedeem && cart.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="use-points-member"
                        name="use-points-member"
                        checked={usePoints}
                        onCheckedChange={(checked: boolean) => {
                          setUsePoints(checked);
                          if (!checked) setPointsToRedeem(0);
                        }}
                        className="scale-75"
                      />
                      <Label htmlFor="use-points-member" className="text-xs cursor-pointer">
                        Tukar Poin (min. {loyaltyMinRedeem})
                      </Label>
                    </div>
                    {usePoints && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={pointsToRedeem}
                          onChange={(e) => {
                            const val = Math.min(maxRedeemablePoints, Math.max(0, parseInt(e.target.value) || 0));
                            setPointsToRedeem(val);
                          }}
                          className="w-16 h-6 text-xs text-right"
                          min={0}
                          max={maxRedeemablePoints}
                        />
                        <span className="text-[10px] text-muted-foreground">/ {maxRedeemablePoints}</span>
                      </div>
                    )}
                  </div>
                  {usePoints && pointsToRedeem > 0 && (
                    <p className="text-[10px] text-green-600 mt-1">
                      Potongan: Rp {pointsRedemptionValue.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              )}
              {/* Points Preview - akan didapat */}
              {cart.length > 0 && pointsToEarn > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
                    <Gift className="h-3 w-3" />
                    <span>Akan dapat +{pointsToEarn} poin dari transaksi ini</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Keranjang kosong</p>
                <p className="text-sm text-muted-foreground">Tambahkan produk untuk memulai</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Rp {(item.unitPrice || 0).toLocaleString('id-ID')} × {item.quantity}
                      <span className="ml-2 text-muted-foreground/60">
                        (Stok: {item.availableStock - item.quantity})
                      </span>
                    </p>
                    <p className="font-bold text-primary">
                      Rp {(item.totalPrice || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.availableStock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Cart Summary */}
        <div className="border-t p-4 space-y-3">
          {/* Discount Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Popover open={discountOpen} onOpenChange={setDiscountOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-between",
                      selectedDiscount && "border-green-500 bg-green-50 text-green-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      {selectedDiscount ? (
                        <span className="truncate">
                          {selectedDiscount.name} 
                          ({selectedDiscount.discount_type === 'percentage' 
                            ? `${selectedDiscount.discount_value}%` 
                            : `Rp ${selectedDiscount.discount_value.toLocaleString('id-ID')}`})
                        </span>
                      ) : (
                        "Pilih Diskon"
                      )}
                    </div>
                    {selectedDiscount ? (
                      <X 
                        className="h-4 w-4 hover:text-destructive" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDiscount(null);
                        }}
                      />
                    ) : (
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[368px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Cari atau masukkan kode diskon..."
                      value={discountCode}
                      onValueChange={setDiscountCode}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {discountCode ? (
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={async () => {
                              try {
                                const res = await discountsApi.validate({ 
                                  code: discountCode,
                                  customer_id: selectedCustomer?.id?.toString(),
                                  amount: subtotal.toString()
                                });
                                if (res.data.valid && res.data.discount) {
                                  setSelectedDiscount(res.data.discount);
                                  setDiscountOpen(false);
                                  setDiscountCode("");
                                  toast({
                                    title: "Diskon diterapkan!",
                                    description: res.data.discount.name,
                                  });
                                }
                              } catch {
                                toast({
                                  variant: "destructive",
                                  title: "Kode tidak valid",
                                  description: "Kode diskon tidak ditemukan atau tidak berlaku.",
                                });
                              }
                            }}
                          >
                            <Tag className="h-4 w-4 mr-2" />
                            Gunakan kode: {discountCode}
                          </Button>
                        ) : (
                          "Tidak ada diskon tersedia"
                        )}
                      </CommandEmpty>
                      <CommandGroup heading="Diskon Tersedia">
                        {discounts
                          .filter(d => {
                            // Filter based on applicable_to
                            if (d.applicable_to === 'member' && !selectedCustomer?.is_member) return false;
                            if (d.applicable_to === 'specific_customer' && d.customer_id !== selectedCustomer?.id) return false;
                            return true;
                          })
                          .map((discount) => (
                          <CommandItem
                            key={discount.id}
                            value={discount.name}
                            onSelect={() => {
                              setSelectedDiscount(discount);
                              setDiscountOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDiscount?.id === discount.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span>{discount.name}</span>
                                {discount.applicable_to === 'member' && (
                                  <Badge variant="outline" className="text-[10px] px-1">Member</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {discount.discount_type === 'percentage' 
                                  ? `${discount.discount_value}%` 
                                  : `Rp ${discount.discount_value.toLocaleString('id-ID')}`}
                                {discount.min_purchase > 0 && ` • Min. Rp ${discount.min_purchase.toLocaleString('id-ID')}`}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            {/* Tax Toggle */}
            <div className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  id="tax-toggle-cart"
                  name="tax-toggle-cart"
                  checked={taxEnabled}
                  onCheckedChange={(checked: boolean) => setTaxEnabled(checked)}
                />
                <Label htmlFor="tax-toggle-cart" className="text-sm cursor-pointer">
                  Pajak
                </Label>
              </div>
              {taxEnabled && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="w-16 h-7 text-right text-sm"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              )}
            </div>
            
            {taxEnabled && taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak ({taxRate}%)</span>
                <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  {selectedDiscount?.applicable_to === 'member' ? (
                    <Crown className="h-3 w-3" />
                  ) : (
                    <Percent className="h-3 w-3" />
                  )}
                  {selectedDiscount?.applicable_to === 'member' ? 'Diskon Member' : 'Diskon'} 
                  {selectedDiscount?.name && (
                    <span className="text-xs">({selectedDiscount.name})</span>
                  )}
                </span>
                <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            {/* Points Redemption in Summary */}
            {pointsRedemptionValue > 0 && (
              <div className="flex justify-between text-amber-600">
                <span className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  Tukar {pointsToRedeem} Poin
                </span>
                <span>-Rp {pointsRedemptionValue.toLocaleString('id-ID')}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            {/* Points to earn preview */}
            {selectedCustomer?.is_member && pointsToEarn > 0 && (
              <div className="flex justify-between text-xs text-amber-600">
                <span className="flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  Poin yang didapat
                </span>
                <span>+{pointsToEarn} poin</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Bersihkan
            </Button>
            <Button
              className="flex-1"
              onClick={handlePayment}
              disabled={cart.length === 0 || !selectedStore}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Bayar
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Cart Dialog */}
      <Dialog open={showMobileCart} onOpenChange={setShowMobileCart}>
        <DialogContent className="sm:max-w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang ({cart.reduce((sum, item) => sum + item.quantity, 0)} item)
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {/* Mobile Cart Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Keranjang kosong</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Rp {(item.unitPrice || 0).toLocaleString('id-ID')} × {item.quantity}
                      </p>
                      <p className="font-bold text-primary text-sm">
                        Rp {(item.totalPrice || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.availableStock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {/* Mobile Cart Footer */}
          <div className="border-t p-4 space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {taxEnabled && taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pajak ({taxRate}%)</span>
                  <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    {selectedDiscount?.applicable_to === 'member' ? (
                      <Crown className="h-3 w-3" />
                    ) : (
                      <Percent className="h-3 w-3" />
                    )}
                    {selectedDiscount?.applicable_to === 'member' ? 'Diskon Member' : 'Diskon'}
                  </span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  clearCart();
                  setShowMobileCart(false);
                }}
                disabled={cart.length === 0}
              >
                <X className="h-4 w-4 mr-2" />
                Bersihkan
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowMobileCart(false);
                  handlePayment();
                }}
                disabled={cart.length === 0 || !selectedStore}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Bayar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pembayaran
            </DialogTitle>
            <DialogDescription>
              Total: <span className="font-bold text-primary text-lg">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.value}
                    variant={paymentMethod === method.value ? "default" : "outline"}
                    className="flex-1 min-w-[80px]"
                    size="sm"
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <method.icon className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Paid Amount */}
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Jumlah Dibayar</Label>
              <Input
                id="paidAmount"
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="text-xl sm:text-2xl h-12 sm:h-14 font-bold"
                placeholder="0"
              />
            </div>

            {/* Quick Amounts */}
            {paymentMethod === "cash" && (
              <div className="grid grid-cols-3 sm:flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                    onClick={() => setPaidAmount(amount.toString())}
                  >
                    {(amount/1000)}K
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setPaidAmount(Math.ceil(totalAmount / 1000) * 1000 + "")}
                >
                  Pas
                </Button>
              </div>
            )}

            {/* Change */}
            {changeAmount >= 0 && (
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">Kembalian</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambah catatan..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={processPayment} 
              disabled={processing || parseFloat(paidAmount || "0") < totalAmount}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Selesaikan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Print Dialog */}
      {lastSale && (
        <ReceiptPrintDialog
          sale={lastSale}
          open={receiptDialogOpen}
          onOpenChange={setReceiptDialogOpen}
        />
      )}
    </div>
  );
}
