import axios from 'axios';
import  { AxiosError } from "axios";

export const api = axios.create({
    baseURL: "http://localhost:5000/api/v1",
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
    :string
) {
    try {
        const response = await api.post('/signin', {
            email: email,
            password:password
        });
        return {res: response.data , status: response.status};
    } catch (error: unknown) {

        if(error instanceof AxiosError ){
            if (error.response) {
            return {
                res: error.response.data,     
                status: error.response.status
            };
        }throw error;
        }
        
  }
    }


export async function checkLoggedin(){
    try{
        const response:any = await api.get("/loggedin")
        return {res: response.data , status: response.status}

    }catch(error){
       if(error instanceof AxiosError ){
            if (error.response) {
                return {
                    res: error.response.data,     
                    status: error.response.status
                };
            }throw error;
        }
    }
    
}