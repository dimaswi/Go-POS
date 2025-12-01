import { forwardRef, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ReceiptItem {
  id: number;
  product_id: number;
  product?: {
    name: string;
    sku: string;
  };
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
}

interface ReceiptPayment {
  id: number;
  payment_method: string;
  amount: number;
  reference_number?: string;
}

interface ReceiptData {
  sale_number: string;
  created_at: string;
  store?: {
    name: string;
    address?: string;
    phone?: string;
  };
  cashier?: {
    full_name?: string;
    username: string;
  };
  customer?: {
    name: string;
    phone?: string;
  };
  items?: ReceiptItem[];
  payments?: ReceiptPayment[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  notes?: string;
}

interface ReceiptPrintProps {
  sale: ReceiptData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Tunai",
  card: "Kartu",
  digital_wallet: "E-Wallet",
  credit: "Kredit",
  multiple: "Multiple",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: id });
  } catch {
    return dateString;
  }
};

// Receipt Component for Print (80mm thermal printer = ~48 characters width)
const ReceiptContent = forwardRef<HTMLDivElement, { sale: ReceiptData }>(
  ({ sale }, ref) => {
    return (
      <div
        ref={ref}
        className="receipt-content"
        style={{
          width: "80mm",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: "12px",
          padding: "5mm",
          backgroundColor: "white",
          color: "black",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            {sale.store?.name || "TOKO"}
          </div>
          {sale.store?.address && (
            <div style={{ fontSize: "10px" }}>{sale.store.address}</div>
          )}
          {sale.store?.phone && (
            <div style={{ fontSize: "10px" }}>Tel: {sale.store.phone}</div>
          )}
        </div>

        <div style={{ borderTop: "1px dashed black", marginBottom: "8px" }} />

        {/* Transaction Info */}
        <div style={{ fontSize: "11px", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>No:</span>
            <span>{sale.sale_number}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tanggal:</span>
            <span>{formatDate(sale.created_at)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Kasir:</span>
            <span>{sale.cashier?.full_name || sale.cashier?.username || "-"}</span>
          </div>
          {sale.customer && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Pelanggan:</span>
              <span>{sale.customer.name}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px dashed black", marginBottom: "8px" }} />

        {/* Items */}
        <div style={{ marginBottom: "8px" }}>
          {sale.items?.map((item, index) => (
            <div key={item.id} style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: "500" }}>
                {item.product?.name || `Item ${index + 1}`}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span>
                  {item.quantity} x Rp {formatCurrency(item.unit_price)}
                </span>
                <span>Rp {formatCurrency(item.total_price)}</span>
              </div>
              {item.discount_amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666" }}>
                  <span>Diskon</span>
                  <span>-Rp {formatCurrency(item.discount_amount)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px dashed black", marginBottom: "8px" }} />

        {/* Summary */}
        <div style={{ fontSize: "11px", marginBottom: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>Rp {formatCurrency(sale.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Pajak (PPN 11%)</span>
            <span>Rp {formatCurrency(sale.tax_amount)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Diskon</span>
              <span>-Rp {formatCurrency(sale.discount_amount)}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid black", marginBottom: "4px" }} />

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>
          <span>TOTAL</span>
          <span>Rp {formatCurrency(sale.total_amount)}</span>
        </div>

        <div style={{ borderTop: "1px solid black", marginBottom: "8px" }} />

        {/* Payment */}
        <div style={{ fontSize: "11px", marginBottom: "8px" }}>
          {sale.payments?.map((payment) => (
            <div key={payment.id} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{paymentMethodLabels[payment.payment_method] || payment.payment_method}</span>
              <span>Rp {formatCurrency(payment.amount)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span>Dibayar</span>
            <span>Rp {formatCurrency(sale.paid_amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>Kembalian</span>
            <span>Rp {formatCurrency(sale.change_amount)}</span>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <>
            <div style={{ borderTop: "1px dashed black", marginBottom: "6px" }} />
            <div style={{ fontSize: "10px" }}>
              <div style={{ fontWeight: "bold" }}>Catatan:</div>
              <div>{sale.notes}</div>
            </div>
          </>
        )}

        <div style={{ borderTop: "1px dashed black", marginTop: "8px", marginBottom: "8px" }} />

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "11px" }}>
          <div>Terima Kasih</div>
          <div>Atas Kunjungan Anda</div>
          <div style={{ fontSize: "10px", marginTop: "4px", color: "#666" }}>
            Barang yang sudah dibeli
          </div>
          <div style={{ fontSize: "10px", color: "#666" }}>
            tidak dapat ditukar/dikembalikan
          </div>
        </div>
      </div>
    );
  }
);

ReceiptContent.displayName = "ReceiptContent";

export function ReceiptPrintDialog({ sale, open, onOpenChange }: ReceiptPrintProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk - ${sale.sale_number}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Courier New', Courier, monospace;
            }
            @media print {
              body {
                width: 80mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Cetak Struk
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="border rounded-lg overflow-auto bg-white max-h-[60vh]">
          <div className="p-4 flex justify-center">
            <ReceiptContent ref={receiptRef} sale={sale} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact button component for use in tables/lists
export function PrintReceiptButton({ 
  sale, 
  variant = "ghost",
  size = "icon",
}: { 
  sale: ReceiptData;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Printer className="h-4 w-4" />
      </Button>
      <ReceiptPrintDialog sale={sale} open={open} onOpenChange={setOpen} />
    </>
  );
}
