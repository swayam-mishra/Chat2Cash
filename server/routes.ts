import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import { storage } from "./storage";
import { extractOrderFromMessage, extractOrderFromChat } from "./anthropic";
import { extractOrderRequestSchema, extractOrderFromChatRequestSchema } from "@shared/schema";
import type { Invoice, InvoiceItem } from "@shared/schema";
import { z } from "zod";
import { log } from "./index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed =
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /\.repl\.co$/.test(origin) ||
        /\.replit\.dev$/.test(origin) ||
        /\.replit\.app$/.test(origin);
      callback(null, allowed || true);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "Chat2Cash API Online",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      endpoints: [
        "POST /api/extract-order",
        "GET /api/orders",
        "POST /api/generate-invoice",
        "GET /api/stats",
      ],
    });
  });

  app.get("/api/stats", async (_req, res) => {
    const chatOrders = await storage.getChatOrders();
    const sorted = chatOrders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const total_orders = sorted.length;
    const pending_payments = sorted.filter((o) => o.status === "pending").length;
    const total_revenue = sorted.reduce((sum, o) => sum + (o.total || 0), 0);
    const recent_orders = sorted.slice(0, 10);
    res.json({ total_orders, pending_payments, total_revenue, recent_orders });
  });

  app.get("/api/orders", async (_req, res) => {
    const chatOrders = await storage.getChatOrders();
    const allOrders = chatOrders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const pending = allOrders.filter((o) => o.status === "pending").length;
    res.json({
      orders: allOrders,
      total: allOrders.length,
      pending,
    });
  });

  app.get("/api/orders/:id", async (req, res) => {
    const order = await storage.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  });

  app.post("/api/extract", async (req, res) => {
    log("POST /api/extract — incoming request", "routes");
    try {
      const parsed = extractOrderRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        log(`Validation failed: ${parsed.error.errors[0].message}`, "routes");
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const order = await extractOrderFromMessage(parsed.data.message);
      const saved = await storage.addOrder(order);
      log(`Order ${saved.id} created with ${saved.items.length} items`, "routes");
      res.json(saved);
    } catch (error: any) {
      const msg = error.message || "Failed to extract order";
      log(`Extract failed: ${msg}`, "routes");
      if (msg === "AI extraction failed") {
        return res.status(500).json({ message: "AI extraction failed" });
      }
      res.status(500).json({ message: msg });
    }
  });

  app.post("/api/extract-order", async (req, res) => {
    log("POST /api/extract-order — incoming request", "routes");
    try {
      const parsed = extractOrderFromChatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMsg = parsed.error.errors[0].message;
        log(`Validation failed: ${errorMsg}`, "routes");
        return res.status(400).json({ message: errorMsg });
      }

      if (parsed.data.messages.length === 0) {
        log("Empty messages array received", "routes");
        return res.status(400).json({ message: "No messages provided" });
      }

      const order = await extractOrderFromChat(parsed.data.messages);
      const saved = await storage.addChatOrder(order);
      log(
        `Chat order ${saved.id} created — customer: ${saved.customer_name}, ${saved.items.length} items, confidence: ${saved.confidence}`,
        "routes",
      );
      res.json(saved);
    } catch (error: any) {
      const msg = error.message || "Failed to extract order from chat";
      log(`Chat extract failed: ${msg}`, "routes");
      if (msg === "AI extraction failed") {
        return res.status(500).json({ message: "AI extraction failed" });
      }
      res.status(500).json({ message: msg });
    }
  });

  app.post("/api/generate-invoice", async (req, res) => {
    log("POST /api/generate-invoice — incoming request", "routes");
    try {
      const invoiceRequestSchema = z.object({
        order_id: z.string().min(1, "order_id is required"),
        business_name: z.string().optional(),
        gst_number: z.string().optional(),
      });
      const parsed = invoiceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { order_id, business_name, gst_number } = parsed.data;

      const order = await storage.getChatOrder(order_id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const invoiceItems: InvoiceItem[] = order.items.map((item) => {
        const price = item.price ?? 0;
        return {
          product_name: item.product_name,
          quantity: item.quantity,
          price,
          amount: parseFloat((item.quantity * price).toFixed(2)),
        };
      });

      const subtotal = parseFloat(
        invoiceItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
      );
      const cgst = parseFloat((subtotal * 0.09).toFixed(2));
      const sgst = parseFloat((subtotal * 0.09).toFixed(2));
      const total = parseFloat((subtotal + cgst + sgst).toFixed(2));

      const hasMissingPrices = order.items.some((item) => item.price == null);

      const invoice: Invoice = {
        invoice_number: `INV-${Date.now()}`,
        date: dateStr,
        customer_name: order.customer_name || "Customer",
        items: invoiceItems,
        subtotal,
        cgst,
        sgst,
        total,
        business_name: business_name || "Your Business Name",
        gst_number: gst_number || "29XXXXX1234X1Z5",
      };

      await storage.attachInvoice(order_id, invoice);

      log(
        `Invoice ${invoice.invoice_number} generated for order ${order_id} — subtotal: ₹${subtotal}, total: ₹${total}${hasMissingPrices ? " (some prices missing, used 0)" : ""}`,
        "routes",
      );

      res.json(invoice);
    } catch (error: any) {
      const msg = error.message || "Failed to generate invoice";
      log(`Invoice generation failed: ${msg}`, "routes");
      res.status(500).json({ message: msg });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const statusSchema = z.object({
        status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]),
      });
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid status. Must be: pending, confirmed, fulfilled, or cancelled" });
      }

      const order = await storage.updateOrderStatus(req.params.id, parsed.data.status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      log(`Order ${req.params.id} status updated to ${parsed.data.status}`, "routes");
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteOrder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }
      log(`Order ${req.params.id} deleted`, "routes");
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete order" });
    }
  });

  app.post("/api/demo/load-sample-data", async (_req, res) => {
    log("POST /api/demo/load-sample-data — loading sample orders", "routes");

    const now = Date.now();
    const DAY = 86400000;

    const sampleOrders = [
      {
        id: String(now - 1),
        customer_name: "Priya Sharma",
        items: [
          { product_name: "Banarasi silk saree - red", quantity: 2, price: 8500 },
          { product_name: "Matching blouse piece", quantity: 2, price: 750 },
        ],
        delivery_address: "B-42, Lajpat Nagar, New Delhi",
        delivery_date: "tomorrow",
        special_instructions: "Gift wrapping needed",
        total: 18500,
        confidence: "high" as const,
        status: "pending",
        created_at: new Date(now - 1 * DAY).toISOString(),
        raw_messages: [{ sender: "Priya Sharma", text: "2 Banarasi silk saree red color @ 8500 each aur matching blouse piece bhi chahiye @ 750 each. Kal tak deliver kar do. Gift wrap karna." }],
      },
      {
        id: String(now - 2),
        customer_name: "Rajesh Gupta",
        items: [
          { product_name: "Cotton kurti - blue printed", quantity: 10, price: 450 },
          { product_name: "Cotton kurti - yellow plain", quantity: 5, price: 350 },
        ],
        delivery_address: "Shop 12, Sarojini Nagar Market, Delhi",
        delivery_date: "Friday",
        special_instructions: "Wholesale order, need proper packaging",
        total: 6250,
        confidence: "high" as const,
        status: "confirmed",
        created_at: new Date(now - 2 * DAY).toISOString(),
        raw_messages: [{ sender: "Rajesh Gupta", text: "Bhaiya 10 piece blue printed cotton kurti 450 wali aur 5 piece yellow plain 350 wali Friday tak chahiye. Wholesale packaging karna." }],
      },
      {
        id: String(now - 3),
        customer_name: "Meena Patel",
        items: [
          { product_name: "Chanderi suit set - pastel green", quantity: 3, price: 2800 },
          { product_name: "Dupatta - organza embroidered", quantity: 3, price: 600 },
        ],
        delivery_address: null,
        delivery_date: "next week",
        special_instructions: null,
        total: 10200,
        confidence: "high" as const,
        status: "pending",
        created_at: new Date(now - 2.5 * DAY).toISOString(),
        raw_messages: [{ sender: "Meena Patel", text: "3 Chanderi suit set pastel green 2800 each with organza embroidered dupatta 600 each. Next week tak bhej dena." }],
      },
      {
        id: String(now - 4),
        customer_name: "Anita Verma",
        items: [
          { product_name: "Phulkari dupatta - multicolor", quantity: 6, price: 1200 },
        ],
        delivery_address: "14, MG Road, Amritsar, Punjab",
        delivery_date: null,
        special_instructions: "All different color combinations please",
        total: 7200,
        confidence: "high" as const,
        status: "fulfilled",
        created_at: new Date(now - 4 * DAY).toISOString(),
        raw_messages: [{ sender: "Anita Verma", text: "6 Phulkari dupatta chahiye multicolor 1200 each. Sab alag alag color combination rakhna. Amritsar bhejne hain." }],
      },
      {
        id: String(now - 5),
        customer_name: "Kavita Joshi",
        items: [
          { product_name: "Pashmina shawl - kashmiri embroidery", quantity: 1, price: 15000 },
          { product_name: "Cashmere scarf - plain grey", quantity: 2, price: 3500 },
        ],
        delivery_address: "Flat 801, Oberoi Garden, Mumbai",
        delivery_date: "parso",
        special_instructions: "Premium packaging, it's a wedding gift",
        total: 22000,
        confidence: "high" as const,
        status: "confirmed",
        created_at: new Date(now - 3 * DAY).toISOString(),
        raw_messages: [{ sender: "Kavita Joshi", text: "1 Pashmina shawl kashmiri embroidery wala 15000 aur 2 cashmere scarf plain grey 3500 each. Parso tak chahiye Mumbai. Wedding gift hai toh premium packing karna." }],
      },
      {
        id: String(now - 6),
        customer_name: "Deepak Singh",
        items: [
          { product_name: "Lucknowi chikankari kurti - white", quantity: 20, price: 550 },
          { product_name: "Lucknowi chikankari kurti - peach", quantity: 15, price: 550 },
        ],
        delivery_address: "Aminabad Market, Lucknow",
        delivery_date: "next Monday",
        special_instructions: "Bulk order for store. Need GST bill.",
        total: 19250,
        confidence: "high" as const,
        status: "pending",
        created_at: new Date(now - 1.5 * DAY).toISOString(),
        raw_messages: [{ sender: "Deepak Singh", text: "Bhaiya 20 piece white aur 15 piece peach Lucknowi chikankari kurti 550 each. Monday tak Aminabad bhej do. GST bill chahiye." }],
      },
      {
        id: String(now - 7),
        customer_name: "Sunita Agarwal",
        items: [
          { product_name: "Georgette saree - party wear black", quantity: 1, price: 4200 },
          { product_name: "Designer blouse - sequence work", quantity: 1, price: 1800 },
        ],
        delivery_address: null,
        delivery_date: "aaj",
        special_instructions: "Urgent - party tonight!",
        total: 6000,
        confidence: "medium" as const,
        status: "fulfilled",
        created_at: new Date(now - 5 * DAY).toISOString(),
        raw_messages: [{ sender: "Sunita Agarwal", text: "Aunty wo black party wear georgette saree aur sequence work designer blouse aaj hi chahiye! Party hai tonight!" }],
      },
      {
        id: String(now - 8),
        customer_name: "Ritu Malhotra",
        items: [
          { product_name: "Silk scarf - maroon paisley", quantity: 12, price: 850 },
          { product_name: "Silk scarf - navy blue solid", quantity: 8, price: 750 },
        ],
        delivery_address: "Karol Bagh, New Delhi",
        delivery_date: "this Saturday",
        special_instructions: "Corporate gifts, need individual boxes",
        total: 16200,
        confidence: "high" as const,
        status: "pending",
        created_at: new Date(now - 0.5 * DAY).toISOString(),
        raw_messages: [{ sender: "Ritu Malhotra", text: "12 maroon paisley silk scarf 850 each, 8 navy blue solid 750 each chahiye Saturday tak. Corporate gifts hain toh individual box mein pack karna." }],
      },
    ];

    for (const order of sampleOrders) {
      await storage.addChatOrder(order);
    }

    log(`Loaded ${sampleOrders.length} sample orders`, "routes");
    res.json({ message: "Sample data loaded successfully", count: sampleOrders.length });
  });

  return httpServer;
}
