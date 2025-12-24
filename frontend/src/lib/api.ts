const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string, recaptchaToken?: string) {
    return this.fetch<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, recaptchaToken }),
      }
    );
  }

  async register(data: { email: string; password: string; firstName?: string; lastName?: string; recaptchaToken?: string }) {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.fetch<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }
    );
  }

  async logout(token: string) {
    return this.fetch('/auth/logout', { method: 'POST', token });
  }

  async forgotPassword(email: string) {
    return this.fetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(resetToken: string, password: string) {
    return this.fetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, password }),
    });
  }

  async getMe(token: string) {
    return this.fetch('/auth/me', { token });
  }

  // Users
  async getProfile(token: string) {
    return this.fetch('/users/profile', { token });
  }

  async updateProfile(token: string, data: { firstName?: string; lastName?: string; avatar?: string }) {
    return this.fetch('/users/profile', {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async changePassword(token: string, currentPassword: string, newPassword: string) {
    return this.fetch('/users/change-password', {
      method: 'PUT',
      token,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Mindmaps
  async getMindmaps(token: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.fetch(`/mindmaps${query}`, { token });
  }

  async getMindmap(token: string, id: string) {
    return this.fetch(`/mindmaps/${id}`, { token });
  }

  async createMindmap(token: string, data: { title: string; description?: string; data?: any }) {
    return this.fetch('/mindmaps', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async updateMindmap(token: string, id: string, data: any) {
    return this.fetch(`/mindmaps/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteMindmap(token: string, id: string) {
    return this.fetch(`/mindmaps/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async toggleFavorite(token: string, id: string) {
    return this.fetch(`/mindmaps/${id}/favorite`, {
      method: 'POST',
      token,
    });
  }

  async shareMindmap(token: string, id: string) {
    return this.fetch(`/mindmaps/${id}/share-link`, {
      method: 'POST',
      token,
    });
  }

  async getSharedMindmap(shareToken: string) {
    return this.fetch(`/mindmaps/shared/${shareToken}`);
  }

  async duplicateMindmap(token: string, id: string) {
    return this.fetch(`/mindmaps/${id}/duplicate`, {
      method: 'POST',
      token,
    });
  }

  async getSharedMindmaps(token: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.fetch(`/mindmaps/shared${query}`, { token });
  }

  async getPublicMindmaps(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.fetch(`/mindmaps/public${query}`);
  }

  // Admin
  async getAdminDashboard(token: string) {
    return this.fetch('/admin/dashboard', { token });
  }

  async getAdminSettings(token: string) {
    return this.fetch('/admin/settings', { token });
  }

  async updateAdminSettings(token: string, settings: any) {
    return this.fetch('/admin/settings', {
      method: 'PUT',
      token,
      body: JSON.stringify(settings),
    });
  }

  async getAdminUsers(token: string, params?: Record<string, any>) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }
    const query = Object.keys(cleanParams).length > 0 ? `?${new URLSearchParams(cleanParams).toString()}` : '';
    return this.fetch(`/admin/users${query}`, { token });
  }

  async createAdminUser(token: string, data: any) {
    return this.fetch('/admin/users', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async updateAdminUser(token: string, id: string, data: any) {
    return this.fetch(`/admin/users/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(token: string, id: string) {
    return this.fetch(`/admin/users/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async getAdminMindmaps(token: string, params?: Record<string, any>) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }
    const query = Object.keys(cleanParams).length > 0 ? `?${new URLSearchParams(cleanParams).toString()}` : '';
    return this.fetch(`/admin/mindmaps${query}`, { token });
  }

  async getAdminMindmapById(token: string, id: string) {
    return this.fetch(`/admin/mindmaps/${id}`, { token });
  }

  async updateAdminMindmap(token: string, id: string, data: any) {
    return this.fetch(`/admin/mindmaps/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteAdminMindmap(token: string, id: string) {
    return this.fetch(`/admin/mindmaps/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  async getAdminLogs(token: string, params?: Record<string, any>) {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = String(value);
        }
      });
    }
    const query = Object.keys(cleanParams).length > 0 ? `?${new URLSearchParams(cleanParams).toString()}` : '';
    return this.fetch(`/admin/logs${query}`, { token });
  }

  async getAdminCache(token: string) {
    return this.fetch('/admin/cache', { token });
  }

  async clearAdminCache(token: string, pattern?: string) {
    return this.fetch('/admin/cache/clear', {
      method: 'POST',
      token,
      body: JSON.stringify({ pattern }),
    });
  }
}

export const api = new ApiClient(API_URL);
