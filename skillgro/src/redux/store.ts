import { configureStore } from '@reduxjs/toolkit';
import courseReducer from './features/courseSlice';
import cartSlice from './features/cartSlice';
import productSlice from './features/productSlice';
import wishlistSlice from './features/wishlistSlice';
import authReducer from './features/AuthSlice';
const store = configureStore({
    reducer: {
        course: courseReducer,
        products: productSlice,
        cart: cartSlice,
        wishlist: wishlistSlice,
        auth: authReducer,
    },
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
});

 






export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
