import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

interface Stats {
  total_orders: number;
  pending_payments: number;
  total_revenue: number;
  recent_orders: Array<{
    id: string;
    customer_name: string;
    items: Array<any>;
    total: number;
    created_at: string;
  }>;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  function getLast7DaysData(orders: any[]) {
    const today = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      });
    }
    
    return data;
  }

  function createRevenueChart(orders: any[]) {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const last7Days = getLast7DaysData(orders);
    
    // Simple bar chart
    const maxRevenue = Math.max(...last7Days.map(d => d.revenue));
    const chartWidth = canvas.width;
    const chartHeight = canvas.height;
    const barWidth = chartWidth / 7;
    
    ctx.clearRect(0, 0, chartWidth, chartHeight);
    
    last7Days.forEach((day, index) => {
      const barHeight = maxRevenue > 0 ? (day.revenue / maxRevenue) * chartHeight * 0.8 : 0;
      const x = index * barWidth + 10;
      const y = chartHeight - barHeight;
      
      // Draw bar
      ctx.fillStyle = '#00a884';
      ctx.fillRect(x, y, barWidth - 20, barHeight);
      
      // Draw value
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.fillText(`₹${(day.revenue/1000).toFixed(0)}k`, x, y - 5);

      // Draw label (optional enhancement)
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(day.date, x, chartHeight - 5);
    });
  }

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch stats and orders in parallel to get full data for the chart
      const [statsRes, ordersRes] = await Promise.all([
        fetch('http://localhost:5000/api/stats'),
        fetch('http://localhost:5000/api/orders')
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      
      setStats(statsData);
      
      // Update chart with full order history
      if (ordersData.orders) {
        // Use requestAnimationFrame to ensure canvas is ready
        requestAnimationFrame(() => createRevenueChart(ordersData.orders));
      }

    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 w-full max-w-[450px] min-h-[700px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Orders Dashboard</h2>
        <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/50 shadow-sm">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-3" />
          <div className="text-3xl font-bold text-blue-600 mb-1">{stats?.total_orders || 0}</div>
          <div className="text-xs text-gray-600 font-medium">Total Orders</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/50 shadow-sm">
          <AlertCircle className="w-5 h-5 text-orange-600 mb-3" />
          <div className="text-3xl font-bold text-orange-600 mb-1">{stats?.pending_payments || 0}</div>
          <div className="text-xs text-gray-600 font-medium">Pending</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/50 shadow-sm">
          <div className="w-5 h-5 flex items-center justify-center mb-3">
            <span className="text-lg font-bold text-[#00a884]">₹</span>
          </div>
          <div className="text-xl font-bold text-[#00a884] mb-1">
             {(stats?.total_revenue || 0).toLocaleString('en-IN', { notation: "compact", maximumFractionDigits: 1 })}
          </div>
          <div className="text-xs text-gray-600 font-medium">Revenue</div>
        </div>
      </div>

      {/* Analytics Section - New */}
      <div className="mb-8 analytics-section">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">7-Day Revenue Trend</h3>
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-2">
           <canvas id="revenueChart" width="400" height="150" className="w-full"></canvas>
        </div>
      </div>

      {/* Recent Orders section */}
      <div className="flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Recent Orders</h3>
        
        <div className="space-y-3 mb-6 overflow-y-auto max-h-[400px]">
          {stats?.recent_orders?.map((order) => (
            <div
              key={order.id}
              className="border-l-4 border-[#00a884] bg-gray-50/70 rounded-r-lg p-4 hover:bg-gray-100/70 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-900 group-hover:text-[#00a884] transition-colors">
                  {order.customer_name || 'Unknown'}
                </p>
                <span className="text-xs text-gray-400 font-medium">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {order.items?.length || 0} items
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  ₹{(order.total || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
          {(!stats?.recent_orders || stats.recent_orders.length === 0) && (
             <div className="text-center text-gray-400 py-10 text-sm">No orders found</div>
          )}
        </div>
      </div>
    </div>
  );
}