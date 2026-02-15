import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ExtractedChatOrder } from "@shared/schema";
import { MessageInput } from "@/components/message-input";
import { OrderCard } from "@/components/order-card";
import { StatsBar } from "@/components/stats-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Package, MessageSquare, Sparkles } from "lucide-react";

interface OrdersResponse {
  orders: ExtractedChatOrder[];
  total: number;
  pending: number;
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["/api/orders"],
  });

  const orders = data?.orders ?? [];
  const totalCount = data?.total ?? 0;
  const pendingCount = data?.pending ?? 0;

  const extractMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/extract-order", {
        messages: [{ sender: "Customer", text: message }],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order extracted",
        description: "AI successfully parsed the WhatsApp message.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const fulfilledOrders = orders.filter((o) => o.status === "fulfilled");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight" data-testid="text-app-title">
                Chat2Cash
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                AI Order Extraction
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" data-testid="badge-order-count">
              <Package className="w-3 h-3 mr-1" />
              {totalCount} orders
            </Badge>
            {pendingCount > 0 && (
              <Badge variant="secondary" data-testid="badge-pending-count">
                {pendingCount} pending
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <MessageInput
          onExtract={(message: string) => extractMutation.mutate(message)}
          isLoading={extractMutation.isPending}
        />

        <StatsBar orders={orders} />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1" data-testid="text-empty-title">
              No orders yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Paste a WhatsApp message above and let AI extract the order
              details for you.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Pending ({pendingOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={(status: string) =>
                        updateStatusMutation.mutate({ id: order.id, status })
                      }
                      onDelete={() => deleteMutation.mutate(order.id)}
                    />
                  ))}
                </div>
              </section>
            )}
            {confirmedOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Confirmed ({confirmedOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {confirmedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={(status: string) =>
                        updateStatusMutation.mutate({ id: order.id, status })
                      }
                      onDelete={() => deleteMutation.mutate(order.id)}
                    />
                  ))}
                </div>
              </section>
            )}
            {fulfilledOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Fulfilled ({fulfilledOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {fulfilledOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={(status: string) =>
                        updateStatusMutation.mutate({ id: order.id, status })
                      }
                      onDelete={() => deleteMutation.mutate(order.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
