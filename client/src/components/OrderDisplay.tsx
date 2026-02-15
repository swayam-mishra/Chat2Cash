import { useState } from 'react';
import { User, MapPin, FileText, Loader2, CheckCircle, AlertTriangle, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

// Declare jsPDF on window for TypeScript since we are using the CDN version
declare global {
  interface Window {
    jspdf: any;
  }
}

interface OrderDisplayProps {
  order: any;
}

// Helper functions for confidence visualization
function getConfidenceWidth(level: string) {
  const widths: Record<string, number> = { high: 95, medium: 70, low: 45 };
  return widths[level] || 50;
}

function getConfidenceColor(level: string) {
  const colors: Record<string, string> = {
    high: 'bg-[#00a884]',
    medium: 'bg-yellow-500',
    low: 'bg-red-500'
  };
  return colors[level] || 'bg-gray-500';
}

function getConfidenceExplanation(level: string) {
  const explanations: Record<string, string> = {
    high: 'All details clearly stated in conversation',
    medium: 'Some details inferred from context',
    low: 'Limited information, manual verification recommended'
  };
  return explanations[level] || 'Confidence score unavailable';
}

export function OrderDisplay({ order }: OrderDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);

  const generatePDF = (invoiceData: any) => {
    try {
      // Access jsPDF from the window object (CDN)
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // --- Header Design ---
      // WhatsApp Green Background for Header
      doc.setFillColor(0, 168, 132); 
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("TAX INVOICE", 14, 25);
      
      // Business Details (Right Aligned in Header)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text("My WhatsApp Store", 195, 20, { align: 'right' });
      doc.setFontSize(10);
      doc.text("GSTIN: 29ABCDE1234F1Z5", 195, 26, { align: 'right' });
      doc.text("Bengaluru, Karnataka, India", 195, 32, { align: 'right' });

      // --- Customer & Invoice Info ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Bill To:", 14, 55);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(invoiceData.customer_name || 'Customer', 14, 62);
      
      // Handle multi-line address
      if (order.delivery_address) {
        const addressLines = doc.splitTextToSize(order.delivery_address, 80);
        doc.text(addressLines, 14, 68);
      } else {
        doc.text("Address not provided", 14, 68);
      }

      // Invoice Meta Data
      doc.setFont('helvetica', 'bold');
      doc.text("Invoice Details:", 120, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${invoiceData.invoice_number}`, 120, 62);
      doc.text(`Date: ${invoiceData.date}`, 120, 68);

      // --- Items Table using AutoTable ---
      const tableColumn = ["Item Description", "Qty", "Price", "Amount (INR)"];
      const tableRows = invoiceData.items.map((item: any) => [
        item.product_name,
        item.quantity,
        item.price.toLocaleString('en-IN'),
        item.amount.toLocaleString('en-IN')
      ]);

      doc.autoTable({
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 132], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      // --- Totals Section ---
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      
      // Subtotal
      doc.text(`Subtotal:`, 150, finalY, { align: 'right' });
      doc.text(`${invoiceData.subtotal.toLocaleString('en-IN')}`, 190, finalY, { align: 'right' });

      // Taxes
      doc.text(`CGST (9%):`, 150, finalY + 6, { align: 'right' });
      doc.text(`${invoiceData.cgst.toLocaleString('en-IN')}`, 190, finalY + 6, { align: 'right' });

      doc.text(`SGST (9%):`, 150, finalY + 12, { align: 'right' });
      doc.text(`${invoiceData.sgst.toLocaleString('en-IN')}`, 190, finalY + 12, { align: 'right' });

      // Total Line
      doc.setDrawColor(0, 168, 132);
      doc.setLineWidth(0.5);
      doc.line(120, finalY + 18, 195, finalY + 18);

      // Grand Total
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 168, 132);
      doc.text(`Total:`, 150, finalY + 26, { align: 'right' });
      doc.text(`INR ${invoiceData.total.toLocaleString('en-IN')}`, 190, finalY + 26, { align: 'right' });

      // --- Footer ---
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text("Thank you for your business!", 105, 280, { align: 'center' });
      doc.text("Generated by Chat2Cash", 105, 285, { align: 'center' });

      // Open PDF in new tab
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Check console.");
    }
  };

  const handleGenerateInvoice = async () => {
    if (!order?.id) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: order.id,
          business_name: "My WhatsApp Store" 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        toast.success(`Invoice #${data.invoice_number} Generated!`);
        
        // Auto-generate PDF on success
        generatePDF(data);
      }
    } catch (error) {
      console.error("Invoice generation failed", error);
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 w-full max-w-[400px] min-h-[700px]">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Extracted Order</h2>
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-lg py-16">
          <div className="text-8xl mb-6 opacity-40">⬆️</div>
          <p className="text-[#999] text-center text-base px-8 leading-relaxed">
            Load chat and click 'Extract Order' to see details here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      key={order.id} 
      className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 w-full max-w-[400px] min-h-[700px] animate-in slide-in-from-right-8 fade-in duration-700"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Extracted Order</h2>
      
      <div className="border-2 border-[#00a884] rounded-lg p-6 space-y-6 bg-white shadow-sm relative overflow-hidden">
        
        {/* Confidence Ribbon */}
        <div className="absolute top-0 right-0">
            <div className={`text-[10px] font-bold px-3 py-1 text-white uppercase rounded-bl-lg ${
                order.confidence === 'high' ? 'bg-[#00a884]' : 'bg-orange-500'
            }`}>
                {order.confidence} Confidence
            </div>
        </div>

        {/* Customer info */}
        <div className="flex items-center gap-3 pb-5 border-b border-gray-200">
          <div className="w-10 h-10 bg-[#00a884]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#00a884]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{order.customer_name || 'Unknown Customer'}</p>
            <p className="text-sm text-gray-500">WhatsApp Contact</p>
          </div>
        </div>

        {/* Items section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Order Items</h3>
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="border-l-4 border-[#00a884] pl-4 py-2.5 bg-gray-50/50 rounded-r">
                <p className="text-sm font-semibold text-gray-900">
                  {item.quantity}x {item.product_name}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {item.price ? `₹${item.price.toLocaleString('en-IN')} each` : 'Price not detected'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery info */}
        <div className="flex items-start gap-3 py-4 bg-gray-50/50 rounded-lg px-4">
          <div className="w-10 h-10 bg-[#00a884]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-[#00a884]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Delivery Address</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {order.delivery_address || 'No address found in chat'}
            </p>
          </div>
        </div>

        {/* Total amount */}
        <div className="pt-5 border-t-2 border-gray-200 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-700">Total Amount</span>
            <span className="text-3xl font-bold text-[#00a884]">
              {order.total ? `₹${order.total.toLocaleString('en-IN')}` : '₹0'}
            </span>
          </div>
        </div>

        {/* Confidence Score Visualization */}
        <div className="mt-2 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Confidence Score</span>
            <span className={`text-xs font-bold ${
              order.confidence === 'high' ? 'text-[#00a884]' : 
              order.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {getConfidenceWidth(order.confidence)}%
            </span>
          </div>
          
          <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getConfidenceColor(order.confidence)}`}
              style={{ width: `${getConfidenceWidth(order.confidence)}%` }}
            />
          </div>

          <div className="flex items-start gap-1.5 mt-2 text-xs text-gray-500">
             {order.confidence === 'high' ? (
               <Check className="w-3.5 h-3.5 text-[#00a884] flex-shrink-0" /> 
             ) : (
               <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
             )}
             <span>{getConfidenceExplanation(order.confidence)}</span>
          </div>
        </div>

        {/* Generate Invoice button */}
        {invoice ? (
           <div className="flex gap-2 w-full">
             <button 
               onClick={() => generatePDF(invoice)}
               className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
             >
               <Download className="w-4 h-4" />
               Download PDF
             </button>
             <button 
                className="w-12 bg-green-100 text-green-700 rounded-lg flex items-center justify-center border border-green-200 cursor-default"
                title="Invoice Generated"
              >
                <CheckCircle className="w-5 h-5" />
             </button>
           </div>
        ) : (
            <button 
              onClick={handleGenerateInvoice}
              disabled={isGenerating}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-blue-400"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isGenerating ? 'Generating...' : 'Generate Invoice'}
            </button>
        )}
      </div>
    </div>
  );
}