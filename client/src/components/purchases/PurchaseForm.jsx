import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import axios from '../../utils/axiosConfig';

const PurchaseForm = ({ onClose, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        supplier_name: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ product_id: '', quantity: 1, cost_price: 0 }],
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/products');
            console.log('Products response:', response.data); // Debug log

            // Handle both array and paginated response
            let productsData = [];
            if (Array.isArray(response.data)) {
                // If response is directly an array
                productsData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                // If response is paginated with data property
                productsData = response.data.data;
            } else {
                // If response is empty or unexpected format
                productsData = [];
            }

            setProducts(productsData);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
            setProducts([]);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product_id: '', quantity: 1, cost_price: 0 }],
        });
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) {
            toast.error('At least one item is required');
            return;
        }
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = formData.items.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate items
        const invalidItems = formData.items.some(item => !item.product_id || item.quantity <= 0 || item.cost_price <= 0);
        if (invalidItems) {
            toast.error('Please fill all item fields correctly');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/purchases', formData);
            toast.success('Purchase created successfully');
            onSuccess();
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error.response?.data?.error || 'Failed to create purchase');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (item.quantity * item.cost_price);
        }, 0);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">New Purchase Order</h3>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Supplier Name *</label>
                            <input
                                type="text"
                                value={formData.supplier_name}
                                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Purchase Date *</label>
                            <input
                                type="date"
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Items</h4>
                            <button
                                type="button"
                                onClick={addItem}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700 transition-colors"
                            >
                                <FiPlus /> Add Item
                            </button>
                        </div>
                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="col-span-12 md:col-span-5">
                                    <span className="text-sm font-medium text-gray-700 block mb-1">Product *</span>
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {Array.isArray(products) && products.length > 0 ? (
                                            products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.sku}) - Stock: {p.stock_quantity}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No products available</option>
                                        )}
                                    </select>
                                </div>

                                <div className="col-span-6 md:col-span-2">
                                    <span className="text-sm font-medium text-gray-700 block mb-1">Qty *</span>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                        placeholder="Qty"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        min="1"
                                    />
                                </div>

                                <div className="col-span-5 md:col-span-3">
                                    <span className="text-sm font-medium text-gray-700 block mb-1">Cost Price *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.cost_price}
                                        onChange={(e) => updateItem(index, 'cost_price', parseFloat(e.target.value) || 0)}
                                        placeholder="Cost Price"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="col-span-1 flex items-end">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove item"
                                    >
                                        <FiTrash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-4 p-4 bg-gray-100 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-600">Total Items: {formData.items.length}</p>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                            Total: Rs. {calculateTotal().toFixed(2)}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || formData.items.some(item => !item.product_id)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                'Create Purchase'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseForm;