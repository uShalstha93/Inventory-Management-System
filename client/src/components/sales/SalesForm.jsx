import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import axios from '../../utils/axiosConfig';

const SalesForm = ({ onClose, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        sale_date: new Date().toISOString().split('T')[0],
        discount: 0,
        tax: 0,
        notes: '',
        items: [{ product_id: '', quantity: 1, price: 0 }],
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
                productsData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                productsData = response.data.data;
            } else {
                productsData = [];
            }

            // Filter only products with stock > 0
            const availableProducts = productsData.filter(p => p.stock_quantity > 0);
            setProducts(availableProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
            setProducts([]);
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product_id: '', quantity: 1, price: 0 }],
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
                // If changing product, also update the price
                if (field === 'product_id') {
                    const selectedProduct = products.find(p => p.id === parseInt(value));
                    return {
                        ...item,
                        product_id: value,
                        price: selectedProduct ? parseFloat(selectedProduct.price) : 0,
                        quantity: 1
                    };
                }
                return { ...item, [field]: value };
            }
            return item;
        });
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate items
        const invalidItems = formData.items.some(item => !item.product_id || item.quantity <= 0 || item.price <= 0);
        if (invalidItems) {
            toast.error('Please fill all item fields correctly');
            return;
        }

        setLoading(true);

        try {
            // Prepare data for API
            const saleData = {
                ...formData,
                items: formData.items.map(item => ({
                    product_id: parseInt(item.product_id),
                    quantity: parseInt(item.quantity),
                    price: parseFloat(item.price)
                }))
            };

            await axios.post('/sales', saleData);
            toast.success('Sale created successfully');
            onSuccess();
        } catch (error) {
            console.error('Sale error:', error);
            toast.error(error.response?.data?.error || 'Failed to create sale');
        } finally {
            setLoading(false);
        }
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (parseInt(item.quantity || 0) * parseFloat(item.price || 0));
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const totalAfterDiscount = subtotal - (parseFloat(formData.discount) || 0);
    const total = totalAfterDiscount + (parseFloat(formData.tax) || 0);

    // Get product name by ID for display
    const getProductName = (productId) => {
        if (!productId) return 'Select Product';
        const product = products.find(p => p.id === parseInt(productId));
        return product ? `${product.name} (${product.sku})` : 'Select Product';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">New Sale</h3>
                <form onSubmit={handleSubmit}>
                    {/* Customer Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Customer Name *
                            </label>
                            <input
                                type="text"
                                value={formData.customer_name}
                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Sale Date *
                            </label>
                            <input
                                type="date"
                                value={formData.sale_date}
                                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Customer Email
                            </label>
                            <input
                                type="email"
                                value={formData.customer_email}
                                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Customer Phone
                            </label>
                            <input
                                type="text"
                                value={formData.customer_phone}
                                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Discount and Tax */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Discount (Rs.)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Tax (Rs.)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.tax}
                                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                        />
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-gray-700">Items *</h4>
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
                                {/* Product Select */}
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
                                            products.map((product) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} ({product.sku}) - Stock: {product.stock_quantity}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No products available</option>
                                        )}
                                    </select>
                                    {item.product_id && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Selected: {getProductName(item.product_id)}
                                        </p>
                                    )}
                                </div>

                                {/* Quantity */}
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

                                {/* Price */}
                                <div className="col-span-5 md:col-span-3">
                                    <span className="text-sm font-medium text-gray-700 block mb-1">Selling Price *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                        placeholder="Price"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        min="0"
                                    />
                                </div>

                                {/* Remove Button */}
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

                    {/* Total */}
                    <div className="flex justify-between items-center mb-4 p-4 bg-gray-100 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-600">Subtotal: Rs. {subtotal.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Discount: Rs. {(parseFloat(formData.discount) || 0).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Tax: Rs. {(parseFloat(formData.tax) || 0).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-blue-600">Rs. {total.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Actions */}
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
                                'Create Sale'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesForm;