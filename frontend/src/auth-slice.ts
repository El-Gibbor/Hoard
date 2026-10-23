import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  ApiError,
  clearToken,
  currentAccount,
  getToken,
  registerAccount,
  setToken,
  signInAccount,
  type AuthUser,
  type FieldErrors,
} from './api-client';

export type FormError = {
  message: string;
  details?: FieldErrors;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'anonymous';
};

const fallbackError = (error: unknown): FormError => {
  if (error instanceof ApiError) {
    return { message: error.message, details: error.details };
  }
  return { message: 'Something went wrong. Try again.' };
};

export const restoreSession = createAsyncThunk('auth/restore', async () => {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const result = await currentAccount();
    return { token, user: result.user };
  } catch (error) {
    clearToken();
    throw error;
  }
});

export const signIn = createAsyncThunk<
  { user: AuthUser; token: string },
  { email: string; password: string },
  { rejectValue: FormError }
>('auth/signIn', async (input, { rejectWithValue }) => {
    try {
      const result = await signInAccount(input);
      setToken(result.token);
      return result;
    } catch (error) {
      return rejectWithValue(fallbackError(error));
    }
  },
);

export const signUp = createAsyncThunk<
  { user: AuthUser; token: string },
  { name: string; email: string; password: string },
  { rejectValue: FormError }
>('auth/signUp', async (input, { rejectWithValue }) => {
    try {
      const result = await registerAccount(input);
      setToken(result.token);
      return result;
    } catch (error) {
      return rejectWithValue(fallbackError(error));
    }
  },
);

const initialState: AuthState = {
  user: null,
  token: getToken(),
  status: getToken() ? 'loading' : 'anonymous',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'anonymous';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (!action.payload) {
          state.user = null;
          state.token = null;
          state.status = 'anonymous';
          return;
        }
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'authenticated';
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.status = 'anonymous';
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'authenticated';
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'authenticated';
      });
  },
});

export const { clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
