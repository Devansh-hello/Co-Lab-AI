import axios from 'axios';
import { AxiosError } from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true
})

export async function sendMessage(content: string) {
    try {
        const response = await api.post('/chat-message', {
            message: content
        });
        return response.data;
    } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
    }
}
export async function sendLogin(email: string, password
    : string
) {
    try {
        const response = await api.post('/signin', {
            email: email,
            password: password
        });
        return { res: response.data, status: response.status };
    } catch (error: unknown) {

        if (error instanceof AxiosError) {
            if (error.response) {
                return {
                    res: error.response.data,
                    status: error.response.status
                };
            } throw error;
        }

    }
}

export async function sendSignup(username: string, email: string, password
    : string
) {
    try {
        const response = await api.post('/signup', {
            username: username,
            email: email,
            password: password
        });
        return { res: response.data, status: response.status };
    } catch (error: unknown) {

        if (error instanceof AxiosError) {
            if (error.response) {
                return {
                    res: error.response.data,
                    status: error.response.status
                };
            } throw error;
        }

    }
}


export async function checkLoggedin() {
    try {
        const response = await api.get("/loggedin")
        return { res: response.data, status: response.status }

    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response) {
                return {
                    res: error.response.data,
                    status: error.response.status
                };
            } throw error;
        }
    }

}

export async function sendProject(name: string, description
    : string
) {
    try {
        const response = await api.post('/project', {
            name: name,
            description: description
        });
        return { res: response.data, status: response.status };
    } catch (error: unknown) {

        if (error instanceof AxiosError) {
            if (error.response) {
                return {
                    res: error.response.data,
                    status: error.response.status
                };
            } throw error;
        }

    }
}

export async function deleteProject(id: string) {
    return api.delete(`/project/${id}`)
}

export async function getPosts() {
    try {
        const response = await api.get("/project")
        return response.data

    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response) {
                return {
                    res: error.response.data,
                    status: error.response.status
                };
            } throw error;
        }
    }

}