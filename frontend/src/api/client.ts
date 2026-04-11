import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aft_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expira → redirigir a login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aft_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post<{ access_token: string }>('/auth/login', { username, password });

export const getMe = () => api.get<{ username: string; empresa: string }>('/auth/me');

// ─── FUNDOS ──────────────────────────────────────────────────────────────────
export const getFundos = () => api.get('/fundos/');
export const getFundo = (id: number) => api.get(`/fundos/${id}`);
export const createFundo = (data: any) => api.post('/fundos/', data);
export const updateFundo = (id: number, data: any) => api.put(`/fundos/${id}`, data);
export const deleteFundo = (id: number) => api.delete(`/fundos/${id}`);

// ─── TRABAJADORES ────────────────────────────────────────────────────────────
export const getTrabajadores = (buscar?: string, soloActivos = true) =>
  api.get('/trabajadores/', { params: { buscar, solo_activos: soloActivos } });
export const getTrabajador = (id: number) => api.get(`/trabajadores/${id}`);
export const createTrabajador = (data: any) => api.post('/trabajadores/', data);
export const updateTrabajador = (id: number, data: any) => api.put(`/trabajadores/${id}`, data);
export const deleteTrabajador = (id: number) => api.delete(`/trabajadores/${id}`);

// ─── CONTRATOS ───────────────────────────────────────────────────────────────
export const getContratos = (trabajadorId?: number, fundoId?: number) =>
  api.get('/contratos/', { params: { trabajador_id: trabajadorId, fundo_id: fundoId } });
export const getContrato = (id: number) => api.get(`/contratos/${id}`);
export const createContrato = (data: any) => api.post('/contratos/', data);
export const deleteContrato = (id: number) => api.delete(`/contratos/${id}`);

// ─── PDFs ─────────────────────────────────────────────────────────────────────
export const getPdfUrl = (contratoId: number, tipo: 'todos' | 'contrato' | 'ds44' | 'reglamento' | 'epp') =>
  `${API_URL}/contratos/${contratoId}/pdfs/${tipo}`;

export const downloadPdf = async (contratoId: number, tipo: 'todos' | 'contrato' | 'ds44' | 'reglamento' | 'epp', filename: string) => {
  const token = localStorage.getItem('aft_token');
  const response = await fetch(`${API_URL}/contratos/${contratoId}/pdfs/${tipo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
