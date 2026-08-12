import { request } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

export const authService = {
    register: (username: string, email: string, password: string) =>
        request<AuthResponse>("/api/account/register", {
            method: "POST",
            body: JSON.stringify({ username, email, password }),
        }),
    login: (email: string, password: string) =>
        request<AuthResponse>("/api/account/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),
};
