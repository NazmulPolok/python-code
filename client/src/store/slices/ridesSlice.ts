import { createSlice } from '@reduxjs/toolkit';

interface Ride {
  _id: string;
  passenger: string;
  driver?: string;
  status: string;
  pickupLocation: any;
  dropoffLocation: any;
  estimatedFare: number;
  createdAt: string;
}

interface RidesState {
  rides: Ride[];
  currentRide: Ride | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RidesState = {
  rides: [],
  currentRide: null,
  isLoading: false,
  error: null,
};

const ridesSlice = createSlice({
  name: 'rides',
  initialState,
  reducers: {
    setCurrentRide: (state, action) => {
      state.currentRide = action.payload;
    },
    updateRideStatus: (state, action) => {
      const { rideId, status } = action.payload;
      if (state.currentRide && state.currentRide._id === rideId) {
        state.currentRide.status = status;
      }
    },
  },
});

export const { setCurrentRide, updateRideStatus } = ridesSlice.actions;
export default ridesSlice.reducer;