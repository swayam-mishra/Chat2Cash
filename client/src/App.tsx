import { useState } from 'react';
import { Header } from './components/Header';
import { ChatSimulator } from './components/ChatSimulator';
import { OrderDisplay } from './components/OrderDisplay';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);

  const handleExtractOrder = async (messages: { sender: string; text: string }[]) => {
    // 1. Reading messages
    setExtractionStatus("Reading messages...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // 2. Analyzing with Claude AI (Actual API Call starts here)
      setExtractionStatus("Analyzing with Claude AI...");
      
      const response = await fetch('http://localhost:5000/api/extract-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) throw new Error('Extraction failed');
      
      const data = await response.json();

      // 3. Extracting customer details (Artificial delay for effect)
      setExtractionStatus("Extracting customer details...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. Identifying products (Artificial delay for effect)
      setExtractionStatus("Identifying products and quantities...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 5. Calculating totals (Artificial delay for effect)
      setExtractionStatus("Calculating totals...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 6. Final Result
      setCurrentOrder(data);
    } catch (error) {
      console.error('Error extracting order:', error);
      alert('Failed to connect to backend. Is the server running on port 5000?');
    } finally {
      setExtractionStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[450px_400px_450px] gap-6 justify-center">
          <ChatSimulator 
            onExtract={handleExtractOrder} 
            extractionStatus={extractionStatus}
          />
          
          <OrderDisplay order={currentOrder} />
          
          <Dashboard />
        </div>
      </div>
      <Toaster />
    </div>
  );
}