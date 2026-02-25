import PDFDocument from "pdfkit";
import { Invoice } from "../schema";
import {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { env } from "../config/env";

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

  // Upload PDF buffer to Azure Blob Storage and return a 15-minute SAS URL
  async uploadToStorage(fileName: string, fileBuffer: Buffer): Promise<string> {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      env.AZURE_STORAGE_ACCOUNT_NAME,
      env.AZURE_STORAGE_ACCOUNT_KEY,
    );
    const blobServiceClient = new BlobServiceClient(
      `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
      sharedKeyCredential,
    );

    const containerClient = blobServiceClient.getContainerClient(env.AZURE_STORAGE_CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    });

    // Generate a SAS URL that expires in 15 minutes (Azure equivalent of AWS presigned URL)
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + 15);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: env.AZURE_STORAGE_CONTAINER_NAME,
        blobName: fileName,
        permissions: BlobSASPermissions.parse("r"),
        expiresOn,
      },
      sharedKeyCredential,
    ).toString();

    return `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${env.AZURE_STORAGE_CONTAINER_NAME}/${fileName}?${sasToken}`;
  }
}

export const pdfService = new PdfService();