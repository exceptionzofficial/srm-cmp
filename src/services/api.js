
import axios from 'axios';

// Ensure this points to the backend (development or production)
// In development, we use relative path to trigger the Vite proxy (bypassing CORS)
// In production, we point directly to the backend
const API_BASE_URL = import.meta.env.DEV ? '' : 'https://srm-backend-lake.vercel.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// --- Employees ---
export const getEmployees = async () => {
    const response = await api.get('/api/employees');
    return response.data;
};

export const getEmployeeById = async (id) => {
    const response = await api.get(`/api/employees/${id}`);
    return response.data;
};

export const createEmployee = async (employeeData) => {
    // Use FormData if there's a photo file
    if (employeeData instanceof FormData) {
        const response = await api.post('/api/employees', employeeData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
    const response = await api.post('/api/employees', employeeData);
    return response.data;
};

export const updateEmployee = async (employeeId, updates) => {
    // Use FormData if there's a photo file
    if (updates instanceof FormData) {
        const response = await api.put(`/api/employees/${employeeId}`, updates, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
    const response = await api.put(`/api/employees/${employeeId}`, updates);
    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await api.delete(`/api/employees/${id}`);
    return response.data;
};

// --- Branches (Needed for dropdowns) ---
export const getBranches = async () => {
    const response = await api.get('/api/branches');
    return response.data;
};

export const getPayGroups = async () => {
    const response = await api.get('/api/pay-groups');
    return response.data;
};

// --- Face ---
export const deleteFaceRegistration = async (employeeId) => {
    const response = await api.delete(`/api/face/${employeeId}`);
    return response.data;
};

// ==================== OTP VERIFICATION ENDPOINTS ====================

export const sendOTP = async (email, employeeName) => {
    const response = await api.post('/api/otp/send', { email, employeeName });
    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await api.post('/api/otp/verify', { email, otp });
    return response.data;
};

export const sendSMSOTP = async (phone, employeeName) => {
    const response = await api.post('/api/otp/send-sms', { phone, employeeName });
    return response.data;
};

export const verifySMSOTP = async (phone, otp) => {
    const response = await api.post('/api/otp/verify-sms', { phone, otp });
    return response.data;
};

// --- Salary ---
export const createSalary = async (data) => {
    const response = await api.post('/api/salary', data);
    return response.data;
};

export const getSalaries = async (employeeId) => {
    const response = await api.get(`/api/salary/employee/${employeeId}`);
    return response.data;
};

export const updateSalary = async (salaryId, data) => {
    const response = await api.put(`/api/salary/${salaryId}`, data);
    return response.data;
};

// --- Requests ---
export const getAllRequests = async (status = null) => {
    const url = status ? `/api/requests?status=${status}` : '/api/requests';
    const response = await api.get(url);
    return response.data;
};

export const getRequestsByEmployee = async (employeeId) => {
    const response = await api.get(`/api/requests/employee/${employeeId}`);
    return response.data;
};

export const updateRequestStatus = async (requestId, status, rejectionReason = null) => {
    // hrId should be handled by auth middleware or passed here if we had logged in HR user context
    const response = await api.put(`/api/requests/${requestId}/status`, {
        status,
        hrId: 'hr-admin-1', // Hardcoded for now as per simple auth status
        rejectionReason
    });
    return response.data;
};

// --- Chat Groups ---
export const createGroup = async (groupData) => {
    const response = await api.post('/api/chat/groups', groupData);
    return response.data;
};

export const deleteGroup = async (groupId) => {
    const response = await api.delete(`/api/chat/groups/${groupId}`);
    return response.data;
};

export const getUserGroups = async (userId) => {
    const response = await api.get(`/api/chat/groups/${userId}`);
    return response.data;
};

export const updateGroup = async (groupId, groupData) => {
    const response = await api.put(`/api/chat/groups/${groupId}`, groupData);
    return response.data;
};

export const sendMessage = async (groupId, messageData) => {
    const response = await api.post(`/api/chat/groups/${groupId}/messages`, messageData);
    return response.data;
};

export const getMessages = async (groupId) => {
    const response = await api.get(`/api/chat/groups/${groupId}/messages`);
    return response.data;
};

export const markMessageAsRead = async (groupId, userId) => {
    const response = await api.post(`/api/chat/groups/${groupId}/read`, { userId });
    return response.data;
};

export const votePoll = async (groupId, messageId, userId, optionIndex) => {
    const response = await api.post(`/api/chat/groups/${groupId}/messages/${messageId}/vote`, { userId, optionIndex });
    return response.data;
};

// --- Attendance Report ---
export const getAttendanceReport = async (params) => {
    let queryString = '';
    if (typeof params === 'string') {
        queryString = `?date=${params}`;
    } else if (typeof params === 'object') {
        const query = new URLSearchParams(params).toString();
        queryString = `?${query}`;
    }

    const response = await api.get(`/api/attendance/report${queryString}`);
    return response.data;
};

export const getAttendanceCalendar = async (employeeId, month, year) => {
    const response = await api.get(`/api/attendance/calendar/${employeeId}`, {
        params: { month, year }
    });
    return response.data;
};

export const getEmployeeRules = async () => {
    const response = await api.get('/api/settings/rules');
    return response.data;
};

// ==================== BRANCH / FINANCE ENDPOINTS ====================

export const getPendingFundRequests = async (role) => {
    const response = await api.get(`/api/finance/pending/${role}`);
    return response.data;
};

export const processFundRequest = async (data) => {
    const response = await api.post('/api/finance/action', data);
    return response.data;
};

// --- Clusters ---
export const getClusters = async () => {
    const response = await api.get('/api/clusters');
    return response.data;
};

export const getCluster = async (id) => {
    const response = await api.get(`/api/clusters/${id}`);
    return response.data;
};

export const getClustersByManager = async (managerId) => {
    const response = await api.get(`/api/clusters/manager/${managerId}`);
    return response.data;
};

export const createCluster = async (data) => {
    const response = await api.post('/api/clusters', data);
    return response.data;
};

export const updateCluster = async (id, data) => {
    const response = await api.put(`/api/clusters/${id}`, data);
    return response.data;
};

export const deleteCluster = async (id) => {
    const response = await api.delete(`/api/clusters/${id}`);
    return response.data;
};

// --- Auth ---
export const loginUser = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
};

export const checkUserStatus = async (email) => {
    const response = await api.post('/api/auth/status', { email });
    return response.data;
};

export default api;
