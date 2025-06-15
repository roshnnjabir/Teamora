import axios from 'axios';

// Create an axios instance with a base URL
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
});

export async function loginUser(email, password) {
  try {
    const response = await apiClient.post('/api/token/', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || 'Login failed. Check credentials.'
    );
  }
}
