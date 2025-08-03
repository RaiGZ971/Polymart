import { API_BASE } from '../config/api.js';
import { getHeaders } from '../config/api.js';

export class ApiClient {
    static getBaseURL() {
        return API_BASE;
    }

    static async request(endpoint, option = {}){
        const url = `${API_BASE}${endpoint}`;
        const headers = getHeaders();
        const config = {
            headers,
            ...option
        };

        try{
            const response = await fetch(url, config);

            if(!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ API Error:', { url, status: response.status, error: errorData });
                throw new Error(errorData.detail || `HTTP error status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        }catch (error){
            console.error(`💥 API request failed: ${error.message}`)
            throw error;
        }
    }

    static async get(endpoint){
        return this.request(endpoint, { method: 'GET' });
    }

    static async post(endpoint, data){
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(endpoint, data){
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async patch(endpoint, data){
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    static async delete(endpoint){
        return this.request(endpoint, { method: 'DELETE'})
    }
}