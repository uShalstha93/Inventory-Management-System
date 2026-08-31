import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  purchases: [],
  loading: false,
  error: null,
};

const purchaseSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    setPurchases: (state, action) => {
      state.purchases = action.payload;
    },
    addPurchase: (state, action) => {
      state.purchases.push(action.payload);
    },
    updatePurchase: (state, action) => {
      const index = state.purchases.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.purchases[index] = action.payload;
      }
    },
    removePurchase: (state, action) => {
      state.purchases = state.purchases.filter(p => p.id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setPurchases, addPurchase, updatePurchase, removePurchase, setLoading, setError } = purchaseSlice.actions;
export default purchaseSlice.reducer;