import apiClient from './client';

export const salesApi = {
  // Get all sales with optional filters
  getSales: async (params = {}) => {
    const response = await apiClient.get('/sales', { params });
    return response.data;
  },

  // Get single sale by ID
  getSale: async (id) => {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data;
  },

  // Create new sale
  createSale: async (saleData) => {
    const response = await apiClient.post('/sales', saleData);
    return response.data;
  },
};
