import apiClient from '../../contexts/apiClient';

export async function loginUser(email, password) {
  const response = await apiClient.post('/api/token/', { email, password });
  return response.data;
}