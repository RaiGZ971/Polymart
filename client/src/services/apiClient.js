import { API_BASE } from '../config/api.js';
import { getHeaders } from '../config/api.js';

export class ApiClient {
    static async request(endpoint, option = {}){
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: getHeaders(),
            ...option
        };

        try{
            const response = await fetch(url, config);

            if(!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error status: ${response.status}`);
            }

            return await response.json();

        }catch (error){
            console.error(`API request failed: ${error.message}`)
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

    static async delete(endpoint){
        return this.request(endpoint, { method: 'DELETE'})
    }
}