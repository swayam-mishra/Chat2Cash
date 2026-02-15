import type { ExtractedChatOrder } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  User,
  IndianRupee,
  MoreVertical,
  CheckCircle2,
  Package,
  XCircle,
  Clock,
  StickyNote,
  Trash2,
  MapPin,
  CalendarDays,
} from "lucide-react";

interface OrderCardProps {
  order: ExtractedChatOrder;
  onUpdateStatus: (status: string) => void;
  onDelete: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  fulfilled: { label: "Fulfilled", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const statusIcon: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle2,
  fulfilled: Package,
  cancelled: XCircle,
};

const confidenceConfig: Record<string, { variant: "default" | "secondary" | "outline" }> = {
  high: { variant: "default" },
  medium: { variant: "secondary" },
  low: { variant: "outline" },
};

export function OrderCard({ order, onUpdateStatus, onDelete }: OrderCardProps) {
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = statusIcon[order.status] || Clock;
  const confConfig = confidenceConfig[order.confidence] || confidenceConfig.medium;

  return (
    <Card className="p-4 flex flex-col gap-3" data-testid={`card-order-${order.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Badge variant={config.variant} data-testid={`badge-status-${order.id}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
          <Badge variant={confConfig.variant} data-testid={`badge-confidence-${order.id}`}>
            {order.confidence}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-menu-${order.id}`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {order.status !== "confirmed" && (
              <DropdownMenuItem onClick={() => onUpdateStatus("confirmed")} data-testid={`menu-confirm-${order.id}`}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Confirmed
              </DropdownMenuItem>
            )}
            {order.status !== "fulfilled" && (
              <DropdownMenuItem onClick={() => onUpdateStatus("fulfilled")} data-testid={`menu-fulfill-${order.id}`}>
                <Package className="w-4 h-4 mr-2" />
                Mark Fulfilled
              </DropdownMenuItem>
            )}
            {order.status !== "pending" && (
              <DropdownMenuItem onClick={() => onUpdateStatus("pending")} data-testid={`menu-pending-${order.id}`}>
                <Clock className="w-4 h-4 mr-2" />
                Mark Pending
              </DropdownMenuItem>
            )}
            {order.status !== "cancelled" && (
              <DropdownMenuItem onClick={() => onUpdateStatus("cancelled")} data-testid={`menu-cancel-${order.id}`}>
                <XCircle className="w-4 h-4 mr-2" />
                Mark Cancelled
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive"
              data-testid={`menu-delete-${order.id}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {order.customer_name && (
        <div className="flex items-center gap-1.5 text-sm">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span data-testid={`text-customer-${order.id}`}>{order.customer_name}</span>
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-1.5 font-medium text-muted-foreground text-xs">
                Item
              </th>
              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground text-xs">
                Qty
              </th>
              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground text-xs">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className={idx < order.items.length - 1 ? "border-b" : ""}>
                <td className="px-3 py-1.5" data-testid={`text-item-name-${order.id}-${idx}`}>
                  {item.product_name}
                </td>
                <td className="px-3 py-1.5 text-right text-muted-foreground">
                  {item.quantity}
                </td>
                <td className="px-3 py-1.5 text-right">
                  {item.price != null ? `₹${item.price}` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.total != null && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-medium">Total</span>
          <div className="flex items-center gap-0.5 font-semibold" data-testid={`text-total-${order.id}`}>
            <IndianRupee className="w-3.5 h-3.5" />
            {order.total}
          </div>
        </div>
      )}

      {order.delivery_address && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span data-testid={`text-address-${order.id}`}>{order.delivery_address}</span>
        </div>
      )}

      {order.delivery_date && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span data-testid={`text-delivery-date-${order.id}`}>{order.delivery_date}</span>
        </div>
      )}

      {order.special_instructions && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span data-testid={`text-notes-${order.id}`}>{order.special_instructions}</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {new Date(order.created_at).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </Card>
  );
}
