import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    sales: [],
    loading: false,
    error: null,
};

const salesSlice = createSlice({
    name: 'sales',
    initialState,
    reducers: {
        setSales: (state, action) => {
            state.sales = action.payload;
        },
        addSale: (state, action) => {
            state.sales.push(action.payload);
        },
        updateSale: (state, action) => {
            const index = state.sales.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.sales[index] = action.payload;
            }
        },
        removeSale: (state, action) => {
            state.sales = state.sales.filter(s => s.id !== action.payload);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const { setSales, addSale, updateSale, removeSale, setLoading, setError } = salesSlice.actions;
export default salesSlice.reducer;