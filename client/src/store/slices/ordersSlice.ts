import { createSlice } from '@reduxjs/toolkit';

interface Order {
  _id: string;
  customer: string;
  restaurant: any;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      if (state.currentOrder && state.currentOrder._id === orderId) {
        state.currentOrder.status = status;
      }
    },
  },
});

export const { setCurrentOrder, updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;