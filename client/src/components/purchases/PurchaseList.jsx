import React, { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../../utils/axiosConfig';
import PurchaseForm from './PurchaseForm';
import PurchaseView from './PurchaseView';
import Pagination from '../common/Pagination';

const PurchaseList = () => {
    const [purchases, setPurchases] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showView, setShowView] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
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

    // Fetch purchases when page or search term changes
    useEffect(() => {
        fetchPurchases();
    }, [currentPage, debouncedSearchTerm]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/purchases', {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearchTerm
                }
            });

            if (response.data && response.data.data) {
                setPurchases(response.data.data);
                setTotalItems(response.data.total || 0);
                setTotalPages(response.data.totalPages || 0);
            } else {
                setPurchases([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (error) {
            toast.error('Failed to fetch purchases');
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (id) => {
        setSelectedPurchaseId(id);
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

    return (
        <div>
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 font-[Hind]">
                <h2 className="text-2xl font-bold text-gray-800">Purchases</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search purchases..."
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
                        <FiPlus /> New Purchase
                    </button>
                </div>
            </div>

            {/* Search Results Count */}
            {!loading && debouncedSearchTerm && purchases.length > 0 && (
                <div className="text-sm text-gray-500 mb-3">
                    Found {totalItems} {totalItems === 1 ? 'purchase' : 'purchases'} matching "{debouncedSearchTerm}"
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading purchases...</p>
                </div>
            ) : purchases.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    {debouncedSearchTerm ? (
                        <>
                            <p className="text-gray-500 mb-2">No purchases found matching "{debouncedSearchTerm}"</p>
                            <button
                                onClick={clearSearch}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Clear search
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-500">No purchases found. Create your first purchase!</p>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {purchases.map((purchase, index) => (
                                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{purchase.invoice_no}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{purchase.supplier_name}</td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                                            {formatCurrency(purchase.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(purchase.purchase_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center">
                                            <button
                                                onClick={() => handleView(purchase.id)}
                                                className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                                                title="View Purchase Details"
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
                <PurchaseForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        fetchPurchases();
                    }}
                />
            )}

            {showView && selectedPurchaseId && (
                <PurchaseView
                    purchaseId={selectedPurchaseId}
                    onClose={() => {
                        setShowView(false);
                        setSelectedPurchaseId(null);
                    }}
                />
            )}
        </div>
    );
};

export default PurchaseList;