import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiDownload } from 'react-icons/fi';
import axios from '../../utils/axiosConfig';

const SalesView = ({ saleId, onClose }) => {
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSaleDetails();
    }, [saleId]);

    const fetchSaleDetails = async () => {
        try {
            const response = await axios.get(`/sales/${saleId}`);
            setSale(response.data);
        } catch (error) {
            toast.error('Failed to fetch sale details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return `Rs. ${Number(amount).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading sale details...</p>
                </div>
            </div>
        );
    }

    if (!sale) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-4xl my-8 mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Sale Details</h3>
                        <p className="text-sm text-gray-500">Invoice: {sale.invoice_no}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Print"
                        >
                            <FiDownload className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-600 mb-2">Customer Information</h4>
                            <p className="text-lg font-bold text-gray-800">{sale.customer_name}</p>
                            {sale.customer_email && (
                                <p className="text-sm text-gray-600">Email: {sale.customer_email}</p>
                            )}
                            {sale.customer_phone && (
                                <p className="text-sm text-gray-600">Phone: {sale.customer_phone}</p>
                            )}
                            <p className="text-sm text-gray-600">Sale Date: {formatDate(sale.sale_date)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-600 mb-2">Order Summary</h4>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(sale.net_amount)}</p>
                            <p className="text-sm text-gray-600">Items: {sale.items?.length || 0}</p>
                            <p className="text-sm text-gray-600">Created By: {sale.created_by_name || 'System'}</p>
                        </div>
                    </div>

                    {/* Notes */}
                    {sale.notes && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-600 mb-1">Notes</h4>
                            <p className="text-gray-700">{sale.notes}</p>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Items Sold</h4>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sale.items?.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{item.sku}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-700">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(item.price)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-700">Subtotal</td>
                                        <td colSpan="2" className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(sale.total_amount)}</td>
                                    </tr>
                                    {sale.discount > 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-3 text-right text-gray-600">Discount</td>
                                            <td colSpan="2" className="px-4 py-3 text-right text-red-600">-{formatCurrency(sale.discount)}</td>
                                        </tr>
                                    )}
                                    {sale.tax > 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-3 text-right text-gray-600">Tax</td>
                                            <td colSpan="2" className="px-4 py-3 text-right text-yellow-600">+{formatCurrency(sale.tax)}</td>
                                        </tr>
                                    )}
                                    <tr className="bg-blue-50">
                                        <td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-800">Net Amount</td>
                                        <td colSpan="2" className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(sale.net_amount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesView;