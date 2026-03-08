import axios from 'axios'

const client = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : 'https://kisan-saathi-evak.onrender.com',
    headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('ks_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// On 401 → clear storage and redirect to /login
client.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            ;['ks_token', 'ks_name', 'ks_role', 'ks_vehicle', 'ks_veh_type', 'ks_email', 'ks_phone'].forEach((k) =>
                localStorage.removeItem(k)
            )
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export default client
