import { configureStore } from '@reduxjs/toolkit';
import { getToken } from './api-client';
import { authReducer } from './auth-slice';

export const createAppStore = () => {
  const token = getToken();

  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        token,
        status: token ? ('loading' as const) : ('anonymous' as const),
      },
    },
  });
};

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
