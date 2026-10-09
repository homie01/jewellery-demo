import { useId, useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useOrders } from '../../contexts/CommerceContext';
import { products } from '../../data/products';
import { money } from '../../lib/storage';

function shortMoney(value: number) { return value >= 1000 ? `${Math.round(value / 1000)}k` : String(value); }

export function RevenueChart({ days = 14 }: { days?: number }) {
  const { orders } = useOrders();
  const gradientId = useId().replace(/:/g, '');
  const data = useMemo(() => Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const matching = orders.filter((order) => new Date(order.date).toDateString() === date.toDateString() && order.paymentStatus === 'Paid' && order.status !== 'Cancelled');
    return { date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: matching.reduce((sum, order) => sum + order.total, 0) };
  }), [orders, days]);
  return <div className="revenue-chart" role="img" aria-label={`Daily paid order revenue over the last ${days} days`}><ResponsiveContainer width="100%" height={250}><AreaChart data={data} margin={{ top: 10, right: 8, left: -23, bottom: 0 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1F7A63" stopOpacity={0.25} /><stop offset="100%" stopColor="#1F7A63" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#9AA3A8', fontSize: 9 }} minTickGap={36} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#9AA3A8', fontSize: 9 }} tickFormatter={shortMoney} /><Tooltip formatter={(value) => [money(Number(value)), 'Revenue']} contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 11, background: '#ffffff', color: '#081C2D' }} cursor={{ stroke: '#1F7A63' }} /><Area type="monotone" dataKey="revenue" stroke="#1F7A63" strokeWidth={2.5} fill={`url(#${gradientId})`} activeDot={{ r: 5, fill: '#1F7A63', stroke: '#ffffff', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>;
}

const chartColors = ['#1F7A63', '#081C2D', '#9AA3A8', '#2ea385', '#475569'];

export function CategoryChart() {
  const { orders } = useOrders();
  const totals = orders.filter((order) => order.status !== 'Cancelled').flatMap((order) => order.items).reduce<Record<string, number>>((result, item) => {
    const category = products.find((product) => product.id === item.productId)?.category ?? 'Other';
    result[category] = (result[category] ?? 0) + item.price * item.quantity;
    return result;
  }, {});
  const data = Object.entries(totals).map(([name, value]) => ({ name, value }));
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  return <div className="category-chart"><div role="img" aria-label="Sales share by jewellery category"><ResponsiveContainer width="100%" height={195}><PieChart><Pie data={data} dataKey="value" innerRadius={57} outerRadius={78} paddingAngle={3} stroke="none" startAngle={90} endAngle={-270}>{data.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 11, background: '#ffffff', color: '#081C2D' }} /></PieChart></ResponsiveContainer><div className="chart-center"><span>{data.length}</span><small>CATEGORIES</small></div></div><div className="category-legend">{data.map((entry, index) => <div key={entry.name}><span style={{ background: chartColors[index % chartColors.length] }} /><p>{entry.name}</p><strong>{total ? Math.round(entry.value / total * 100) : 0}%</strong></div>)}</div></div>;
}

export function OrdersChart() {
  const { orders } = useOrders();
  const data = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    return { day: date.toLocaleDateString('en-IN', { weekday: 'short' }), orders: orders.filter((order) => new Date(order.date).toDateString() === date.toDateString()).length };
  });
  return <div className="orders-chart" role="img" aria-label="Order volume over the last seven days"><ResponsiveContainer width="100%" height={235}><BarChart data={data} margin={{ top: 10, left: -30, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#9AA3A8', fontSize: 10 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#9AA3A8', fontSize: 9 }} /><Tooltip cursor={{ fill: '#F5F7FA' }} contentStyle={{ border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 11, background: '#ffffff', color: '#081C2D' }} /><Bar dataKey="orders" fill="#1F7A63" maxBarSize={28} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}