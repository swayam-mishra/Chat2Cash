import { useState } from 'react';
import { Header } from './components/Header';
import { ChatSimulator } from './components/ChatSimulator';
import { OrderDisplay } from './components/OrderDisplay';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractOrder = async (messages: { sender: string; text: string }[]) => {
    setIsExtracting(true);
    try {
      const response = await fetch('http://localhost:5000/api/extract-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) throw new Error('Extraction failed');

      const data = await response.json();
      setCurrentOrder(data);
    } catch (error) {
      console.error('Error extracting order:', error);
      alert('Failed to connect to backend. Is the server running on port 5000?');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[450px_400px_450px] gap-6 justify-center">
          <ChatSimulator 
            onExtract={handleExtractOrder} 
            isExtracting={isExtracting}
          />
          
          <OrderDisplay order={currentOrder} />
          
          <Dashboard />
        </div>
      </div>
      <Toaster />
    </div>
  );
}