const rawBase = (import.meta?.env?.BASE_URL || '/').replace(/\/+$/, '');
const API_BASE = `${rawBase}/api`.replace(/\/+/g, '/');

export class ApiError extends Error {
  constructor(message, status = 500, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;
  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
    body:
      options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || `Request gagal (${response.status})`,
      response.status,
      data
    );
  }

  return data;
}

export const api = {
  health: () => apiRequest('/health'),
  getMe: () => apiRequest('/auth/me'),
  login: ({ username, password }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password }
    }),
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: payload
    }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  addXp: (delta) =>
    apiRequest('/auth/xp', {
      method: 'POST',
      body: { delta }
    }),

  getBooks: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '' && v !== 'Semua' && v !== 'All') {
        query.set(k, String(v));
      }
    });
    const qs = query.toString();
    return apiRequest(`/books${qs ? `?${qs}` : ''}`);
  },
  createBook: (book) =>
    apiRequest('/books', {
      method: 'POST',
      body: book
    }),
  bulkImportBooks: (books) =>
    apiRequest('/books/bulk', {
      method: 'POST',
      body: { books }
    }),
  adjustBookStock: (bookId, delta, stockType = 'available') =>
    apiRequest(`/books/${encodeURIComponent(bookId)}/stock`, {
      method: 'PATCH',
      body: { delta, stockType }
    }),

  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') query.set(k, String(v));
    });
    const qs = query.toString();
    return apiRequest(`/users${qs ? `?${qs}` : ''}`);
  },
  createUser: (user) =>
    apiRequest('/users', {
      method: 'POST',
      body: user
    }),
  bulkImportUsers: (users) =>
    apiRequest('/users/bulk', {
      method: 'POST',
      body: { users }
    }),

  getLoans: () => apiRequest('/loans'),
  createLoan: (payload) =>
    apiRequest('/loans', {
      method: 'POST',
      body: payload
    }),
  quickScanLoan: (payload) =>
    apiRequest('/loans/quick', {
      method: 'POST',
      body: payload
    }),
  approveLoan: (loanId) =>
    apiRequest(`/loans/${encodeURIComponent(loanId)}/approve`, { method: 'PATCH' }),
  rejectLoan: (loanId, reason) =>
    apiRequest(`/loans/${encodeURIComponent(loanId)}/reject`, {
      method: 'PATCH',
      body: { reason }
    }),
  returnLoan: (loanId) =>
    apiRequest(`/loans/${encodeURIComponent(loanId)}/return`, { method: 'PATCH' }),

  getReadingLogs: () => apiRequest('/reading-logs'),
  createReadingLog: (payload) =>
    apiRequest('/reading-logs', {
      method: 'POST',
      body: payload
    }),
  gradeReadingLog: (logId, payload) =>
    apiRequest(`/reading-logs/${encodeURIComponent(logId)}/grade`, {
      method: 'PATCH',
      body: payload
    }),

  getLeaderboard: () => apiRequest('/leaderboard'),

  getBookmark: (bookId, source = 'text') =>
    apiRequest(
      `/bookmarks?bookId=${encodeURIComponent(bookId)}&source=${encodeURIComponent(source)}`
    ),
  saveBookmark: (payload) =>
    apiRequest('/bookmarks', {
      method: 'PUT',
      body: payload
    }),

  addReview: (payload) =>
    apiRequest('/reviews', {
      method: 'POST',
      body: payload
    }),
  deleteReview: (reviewId) =>
    apiRequest(`/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE'
    }),
  clearReviewRating: (reviewId) =>
    apiRequest(`/reviews/${encodeURIComponent(reviewId)}/clear-rating`, {
      method: 'PATCH'
    }),
  resetBookReviews: (bookId, mode = 'all') =>
    apiRequest(`/books/${encodeURIComponent(bookId)}/reviews/reset`, {
      method: 'POST',
      body: { mode }
    })
};
