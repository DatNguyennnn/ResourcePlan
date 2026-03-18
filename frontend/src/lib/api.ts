import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
});

// Add auth token from localStorage on each request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  department: string;
  level: string;
  status: string;
}

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  description: string | null;
  pm: string | null;
  status: string;
}

export interface DashboardSummary {
  total_employees: number;
  active_projects: number;
  participation_rate: number;
  over_100_count: number;
  under_60_count: number;
  level_distribution: Record<string, number>;
  department_distribution: Record<string, number>;
  employee_status_distribution: Record<string, number>;
  project_status_distribution: Record<string, number>;
  weekly_summary: {
    week: string;
    participation_rate: number;
    over_100_count: number;
    under_60_count: number;
    employee_count: number;
  }[];
}

export interface ResourceTableData {
  weeks: string[];
  employees: {
    id: number;
    name: string;
    department: string;
    weeks: Record<string, number>;
  }[];
}

export interface EmployeeDetail {
  employee: { id: number; name: string; department: string };
  weeks: string[];
  projects: {
    project_code: string;
    project_name: string;
    project_id: number;
    weeks: Record<string, number>;
  }[];
}

export interface OverloadEntry {
  employee_id: number;
  employee_name: string;
  department: string;
  week: string;
  total_percentage: number;
  projects: { name: string; percentage: number }[];
}

export interface FilterOptions {
  departments: string[];
  levels: string[];
  project_statuses: string[];
  pms: string[];
  project_names: string[];
}

export const fetchFilterOptions = () =>
  api.get<FilterOptions>('/api/dashboard/filter-options').then((r) => r.data);

export const fetchDashboard = (params?: Record<string, string>) =>
  api.get<DashboardSummary>('/api/dashboard/summary', { params }).then((r) => r.data);

export const fetchResourceTable = (params?: Record<string, string>) =>
  api.get<ResourceTableData>('/api/dashboard/resource-table', { params }).then((r) => r.data);

export const fetchEmployeeDetail = (id: number, params?: Record<string, string>) =>
  api.get<EmployeeDetail>(`/api/dashboard/employee-detail/${id}`, { params }).then((r) => r.data);

export const fetchEmployees = (params?: Record<string, string>) =>
  api.get<Employee[]>('/api/employees/', { params }).then((r) => r.data);

export const createEmployee = (data: Omit<Employee, 'id'>) =>
  api.post<Employee>('/api/employees/', data).then((r) => r.data);

export const updateEmployee = (id: number, data: Partial<Employee>) =>
  api.put<Employee>(`/api/employees/${id}`, data).then((r) => r.data);

export const deleteEmployee = (id: number) =>
  api.delete(`/api/employees/${id}`);

export const fetchProjects = (params?: Record<string, string>) =>
  api.get<Project[]>('/api/projects/', { params }).then((r) => r.data);

export const createProject = (data: Omit<Project, 'id'>) =>
  api.post<Project>('/api/projects/', data).then((r) => r.data);

export const updateProject = (id: number, data: Partial<Project>) =>
  api.put<Project>(`/api/projects/${id}`, data).then((r) => r.data);

export const deleteProject = (id: number) =>
  api.delete(`/api/projects/${id}`);

export const importExcel = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const fetchOverloaded = (params?: Record<string, string>) =>
  api.get<OverloadEntry[]>('/api/allocations/overload', { params }).then((r) => r.data);

export const createAllocation = (data: { employee_id: number; project_id: number; week_start: string; allocation_percentage: number }) =>
  api.post('/api/allocations/', data).then((r) => r.data);

export const deleteAllocation = (id: number) =>
  api.delete(`/api/allocations/${id}`);

export const fetchAllocations = (params?: Record<string, string>) =>
  api.get('/api/allocations/', { params }).then((r) => r.data);

export const bulkCreateAllocation = (data: { employee_id: number; project_id: number; allocations: Record<string, number> }) =>
  api.post('/api/allocations/bulk', data).then((r) => r.data);

export const seedAdmin = () =>
  api.post('/api/auth/seed-admin').then((r) => r.data);
