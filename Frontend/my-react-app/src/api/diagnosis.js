import client from './client'

/**
 * Upload a plant image for disease diagnosis
 * @param {File} imageFile
 * @returns {Promise<{ disease_name, confidence, severity, recommendations, image_url }>}
 */
export async function diagnosePlant(imageFile) {
    const form = new FormData()
    form.append('file', imageFile)

    const res = await client.post('/diagnosis/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
}

/**
 * Get past diagnosis history for the logged-in user
 */
export async function fetchDiagnosisHistory() {
    const res = await client.get('/diagnosis/history')
    return res.data
}
