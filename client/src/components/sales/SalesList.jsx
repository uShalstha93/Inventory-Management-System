import React, { useState, useEffect } from 'react';
import { FiPlus, FiEye } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import SalesForm from './SalesForm';
import SalesView from './SalesView';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showView, setShowView] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const response = await axios.get('/sales');
            setSales(response.data);
        } catch (error) {
            toast.error('Failed to fetch sales');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (id) => {
        setSelectedSaleId(id);
        setShowView(true);
    };

    const formatCurrency = (amount) => {
        return `Rs. ${Number(amount).toFixed(2)}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 font-[Hind]">
                <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <FiPlus /> New Sale
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading sales...</p>
                </div>
            ) : sales.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">No sales found. Create your first sale!</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.invoice_no}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{sale.customer_name}</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-700">{formatCurrency(sale.total_amount)}</td>
                                    <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                                        {formatCurrency(sale.net_amount)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(sale.sale_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center">
                                        <button
                                            onClick={() => handleView(sale.id)}
                                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                                            title="View Sale Details"
                                        >
                                            <FiEye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <SalesForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchSales();
                    }}
                />
            )}

            {showView && selectedSaleId && (
                <SalesView
                    saleId={selectedSaleId}
                    onClose={() => {
                        setShowView(false);
                        setSelectedSaleId(null);
                    }}
                />
            )}
        </div>
    );
};

export default SalesList;