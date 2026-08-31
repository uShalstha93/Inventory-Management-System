import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    FiPackage,
    FiShoppingCart,
    FiTrendingUp,
    FiAlertCircle
} from 'react-icons/fi';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import axios from '../../utils/axiosConfig';
import { socket } from '../../app/socket';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalPurchases: 0,
        totalSales: 0,
        lowStockItems: 0,
    });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [categoryDistribution, setCategoryDistribution] = useState([]);
    const [loading, setLoading] = useState(true);

    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        fetchDashboardData();

        // Socket listeners
        socket.on('purchase-update', () => {
            fetchDashboardData();
        });

        socket.on('sale-update', () => {
            fetchDashboardData();
        });

        socket.on('stock-change', () => {
            fetchDashboardData();
        });

        return () => {
            socket.off('purchase-update');
            socket.off('sale-update');
            socket.off('stock-change');
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [
                productsRes,
                categoriesRes,
                purchasesRes,
                salesRes,
                lowStockRes,
                recentTransactionsRes
            ] = await Promise.all([
                axios.get('/products'),
                axios.get('/categories'),
                axios.get('/purchases'),
                axios.get('/sales'),
                axios.get('/products/low-stock'),
                Promise.all([
                    axios.get('/purchases'),
                    axios.get('/sales')
                ])
            ]);

            const allPurchases = purchasesRes.data || [];
            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allCategories = categoriesRes.data || [];
            const lowStock = lowStockRes.data || [];

            // Combine recent transactions
            const recent = [...allPurchases.slice(0, 5), ...allSales.slice(0, 5)]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);

            setStats({
                totalProducts: allProducts.length,
                totalCategories: allCategories.length,
                totalPurchases: allPurchases.length,
                totalSales: allSales.length,
                lowStockItems: lowStock.length,
            });

            setRecentTransactions(recent);
            setLowStockProducts(lowStock.slice(0, 5));

            // Prepare sales data for chart (last 7 days)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            const salesByDay = last7Days.map(date => {
                const daySales = allSales.filter(sale =>
                    sale.sale_date && sale.sale_date.startsWith(date)
                );
                return {
                    date: date,
                    sales: daySales.reduce((sum, sale) => sum + Number(sale.net_amount), 0),
                    count: daySales.length
                };
            });

            setSalesData(salesByDay);

            // Category distribution
            const categoryCount = {};
            allProducts.forEach(product => {
                const catName = product.category_name || 'Uncategorized';
                categoryCount[catName] = (categoryCount[catName] || 0) + 1;
            });

            const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
            const distData = Object.entries(categoryCount).map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length]
            }));
            setCategoryDistribution(distData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Total Products"
                    value={stats.totalProducts}
                    icon={FiPackage}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Categories"
                    value={stats.totalCategories}
                    icon={FiTrendingUp}
                    color="bg-green-500"
                />
                <StatCard
                    title="Purchases"
                    value={stats.totalPurchases}
                    icon={FiShoppingCart}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Sales"
                    value={stats.totalSales}
                    icon={FiTrendingUp}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Low Stock Items"
                    value={stats.lowStockItems}
                    icon={FiAlertCircle}
                    color="bg-red-500"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Trend (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#3B82F6" name="Sales Amount" />
                            <Line type="monotone" dataKey="count" stroke="#10B981" name="Number of Sales" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryDistribution}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {categoryDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Transactions & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                        {recentTransactions.length === 0 ? (
                            <p className="text-gray-500">No recent transactions</p>
                        ) : (
                            recentTransactions.map((transaction, index) => (
                                <div key={index} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium text-gray-700">
                                            {transaction.invoice_no || transaction.invoice_no}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {transaction.supplier_name || transaction.customer_name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${transaction.supplier_name ? 'text-blue-600' : 'text-green-600'
                                            }`}>
                                            Rs. {Number(transaction.total_amount || transaction.net_amount).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(transaction.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Alert</h3>
                    <div className="space-y-3">
                        {lowStockProducts.length === 0 ? (
                            <p className="text-green-600">All products are well stocked!</p>
                        ) : (
                            lowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium text-gray-700">{product.name}</p>
                                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-red-600 font-semibold">
                                            Stock: {product.stock_quantity}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Min: {product.min_stock_level}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;