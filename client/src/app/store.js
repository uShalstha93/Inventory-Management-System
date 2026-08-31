import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import categoryReducer from '../features/categories/categorySlice';
import productReducer from '../features/products/productSlice';
import purchaseReducer from '../features/purchases/purchaseSlice';
import salesReducer from '../features/sales/salesSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        categories: categoryReducer,
        products: productReducer,
        purchases: purchaseReducer,
        sales: salesReducer,
    },
});