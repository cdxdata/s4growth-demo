import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearSession, readSession, writeSession } from "@/lib/storage";
import type { AuthIdentity } from "@/types/auth";

type AuthState = {
  identity: AuthIdentity | null;
};

const initialState: AuthState = {
  identity: typeof window === "undefined" ? null : readSession(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIdentity(state, action: PayloadAction<AuthIdentity>) {
      state.identity = action.payload;
      writeSession(action.payload);
    },
    clearIdentity(state) {
      state.identity = null;
      clearSession();
    },
  },
});

export const { setIdentity, clearIdentity } = authSlice.actions;
export const authReducer = authSlice.reducer;
