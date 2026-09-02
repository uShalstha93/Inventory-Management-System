import React, { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import SalesForm from './SalesForm';
import SalesView from './SalesView';
import Pagination from '../common/Pagination';

const SalesList = () => {
    const [sales, setSales] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showView, setShowView] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to first page when searching
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch sales when page or search term changes
    useEffect(() => {
        fetchSales();
    }, [currentPage, debouncedSearchTerm]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/sales', {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearchTerm
                }
            });

            if (response.data && response.data.data) {
                setSales(response.data.data);
                setTotalItems(response.data.total || 0);
                setTotalPages(response.data.totalPages || 0);
            } else {
                setSales([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (error) {
            toast.error('Failed to fetch sales');
            console.error('Fetch error:', error);
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

    const clearSearch = () => {
        setSearchTerm('');
        setDebouncedSearchTerm('');
        setCurrentPage(1);
    };

    // Truncate product names if too long
    const truncateText = (text, maxLength = 30) => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div>
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 font-[Hind]">
                <h2 className="text-2xl font-bold text-gray-800">Sales</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search sales..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors whitespace-nowrap w-full sm:w-auto"
                    >
                        <FiPlus /> New Sale
                    </button>
                </div>
            </div>

            {/* Search Results Count */}
            {!loading && debouncedSearchTerm && sales.length > 0 && (
                <div className="text-sm text-gray-500 mb-3">
                    Found {totalItems} {totalItems === 1 ? 'sale' : 'sales'} matching "{debouncedSearchTerm}"
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading sales...</p>
                </div>
            ) : sales.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    {debouncedSearchTerm ? (
                        <>
                            <p className="text-gray-500 mb-2">No sales found matching "{debouncedSearchTerm}"</p>
                            <button
                                onClick={clearSearch}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Clear search
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-500">No sales found. Create your first sale!</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sales.map((sale, index) => (
                                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.invoice_no}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{sale.customer_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <span title={sale.product_names || '-'}>
                                                    {truncateText(sale.product_names || '-', 35)}
                                                </span>
                                                {sale.total_products > 1 && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                        {sale.total_products} items
                                                    </span>
                                                )}
                                            </div>
                                        </td>
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
                                                <span className="hidden sm:inline">View</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        showInfo={true}
                        className="mt-4"
                    />
                </>
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