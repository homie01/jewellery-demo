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
  return <div className="revenue-chart" role="img" aria-label={`Daily paid order revenue over the last ${days} days`}><ResponsiveContainer width="100%" height={250}><AreaChart data={data} margin={{ top: 10, right: 8, left: -23, bottom: 0 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b59a70" stopOpacity={0.2} /><stop offset="100%" stopColor="#b59a70" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eae5dc" /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#918878', fontSize: 9 }} minTickGap={36} dy={10} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#918878', fontSize: 9 }} tickFormatter={shortMoney} /><Tooltip formatter={(value) => [money(Number(value)), 'Revenue']} contentStyle={{ border: '1px solid #e6ded2', borderRadius: 0, fontSize: 11, background: '#fffdf9' }} cursor={{ stroke: '#cbb693' }} /><Area type="monotone" dataKey="revenue" stroke="#a98c59" strokeWidth={2} fill={`url(#${gradientId})`} activeDot={{ r: 4, fill: '#9a7b49', stroke: '#fffdf9', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>;
}

const chartColors = ['#a98c59', '#c3ad88', '#d9c9af', '#e7ded0', '#8a785d'];

export function CategoryChart() {
  const { orders } = useOrders();
  const totals = orders.filter((order) => order.status !== 'Cancelled').flatMap((order) => order.items).reduce<Record<string, number>>((result, item) => {
    const category = products.find((product) => product.id === item.productId)?.category ?? 'Other';
    result[category] = (result[category] ?? 0) + item.price * item.quantity;
    return result;
  }, {});
  const data = Object.entries(totals).map(([name, value]) => ({ name, value }));
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  return <div className="category-chart"><div role="img" aria-label="Sales share by jewellery category"><ResponsiveContainer width="100%" height={195}><PieChart><Pie data={data} dataKey="value" innerRadius={57} outerRadius={78} paddingAngle={3} stroke="none" startAngle={90} endAngle={-270}>{data.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ border: '1px solid #e6ded2', fontSize: 11 }} /></PieChart></ResponsiveContainer><div className="chart-center"><span>{data.length}</span><small>CATEGORIES</small></div></div><div className="category-legend">{data.map((entry, index) => <div key={entry.name}><span style={{ background: chartColors[index % chartColors.length] }} /><p>{entry.name}</p><strong>{total ? Math.round(entry.value / total * 100) : 0}%</strong></div>)}</div></div>;
}

export function OrdersChart() {
  const { orders } = useOrders();
  const data = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    return { day: date.toLocaleDateString('en-IN', { weekday: 'short' }), orders: orders.filter((order) => new Date(order.date).toDateString() === date.toDateString()).length };
  });
  return <div className="orders-chart" role="img" aria-label="Order volume over the last seven days"><ResponsiveContainer width="100%" height={235}><BarChart data={data} margin={{ top: 10, left: -30, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eae5dc" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#918878', fontSize: 10 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#918878', fontSize: 9 }} /><Tooltip cursor={{ fill: '#f4f0e8' }} contentStyle={{ border: '1px solid #e6ded2', fontSize: 11 }} /><Bar dataKey="orders" fill="#b49a73" maxBarSize={28} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}