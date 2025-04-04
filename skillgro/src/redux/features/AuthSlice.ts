// src/features/AuthSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define user data interface matching your schema
interface UserData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

// Define the auth state interface
interface AuthState {
  token: string | null;
  user: UserData | null;
}

// Initialize state with token from localStorage if available
const initialState: AuthState = {
  token: localStorage.getItem("token") || null,
  user: null, // User data will be set after login
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set token and user data, persist token to localStorage
    setToken: (state, action: PayloadAction<{ token: string; user: UserData | null }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem("token", action.payload.token);
    },
    // Clear token and user data, remove token from localStorage
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
    },
  },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;