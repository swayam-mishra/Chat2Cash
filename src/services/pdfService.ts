import PDFDocument from "pdfkit";
import { Invoice } from "../schema";
import fs from "fs";
import path from "path";
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Uncomment when S3 is set up

export class PdfService {
  
  // Generates PDF and returns it as a Buffer (can be streamed to S3 or Client)
  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // --- PDF CONTENT ---
      
      // Header
      doc.fontSize(20).text("INVOICE", { align: "center" });
      doc.moveDown();
      
      doc.fontSize(12).text(invoice.business_name, { align: "right" });
      doc.text(`GSTIN: ${invoice.gst_number}`, { align: "right" });
      doc.moveDown();

      // Details
      doc.text(`Invoice Number: ${invoice.invoice_number}`);
      doc.text(`Date: ${invoice.date}`);
      doc.text(`Customer: ${invoice.customer_name}`);
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      doc.font("Helvetica-Bold");
      doc.text("Item", 50, tableTop);
      doc.text("Qty", 250, tableTop);
      doc.text("Price", 350, tableTop);
      doc.text("Total", 450, tableTop);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.font("Helvetica");
      doc.moveDown(0.5);

      // Items
      invoice.items.forEach((item) => {
        const y = doc.y;
        doc.text(item.product_name, 50, y);
        doc.text(item.quantity.toString(), 250, y);
        doc.text(item.price.toFixed(2), 350, y);
        doc.text(item.amount.toFixed(2), 450, y);
        doc.moveDown();
      });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Totals
      const totalX = 350;
      doc.text("Subtotal:", totalX);
      doc.text(invoice.subtotal.toFixed(2), 450, doc.y - 12); // align with label
      
      doc.text(`CGST:`, totalX);
      doc.text(invoice.cgst.toFixed(2), 450, doc.y - 12);
      
      doc.text(`SGST:`, totalX);
      doc.text(invoice.sgst.toFixed(2), 450, doc.y - 12);
      
      doc.font("Helvetica-Bold");
      doc.text("Total:", totalX, doc.y + 5);
      doc.text(invoice.total.toFixed(2), 450, doc.y - 12); // align with label

      doc.end();
    });
  }

  // Placeholder for S3 Upload
  async uploadToStorage(fileName: string, fileBuffer: Buffer): Promise<string> {
    // In a real implementation:
    // const s3 = new S3Client({ ...env config });
    // await s3.send(new PutObjectCommand({ Bucket: env.AWS_BUCKET_NAME, Key: fileName, Body: fileBuffer }));
    // return `https://${env.AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    
    // For now, save locally to 'temp' folder to demonstrate functionality
    const tempDir = path.join(__dirname, "../../temp_invoices");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    
    return filePath; // Return local path for now
  }
}

export const pdfService = new PdfService();