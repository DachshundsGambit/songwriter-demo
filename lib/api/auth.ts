import api from './client'

export async function register(data: { name: string; email: string; password: string }) {
  const res = await api.post('/auth/register', data)
  return res.data as { user: { id: string; email: string; name: string }; token: string }
}

export async function login(data: { email: string; password: string }) {
  const res = await api.post('/auth/login', data)
  return res.data as { user: { id: string; email: string; name: string }; token: string }
}

export async function getMe() {
  const res = await api.get('/auth/me')
  return res.data as { user: { id: string; email: string; name: string } }
}
