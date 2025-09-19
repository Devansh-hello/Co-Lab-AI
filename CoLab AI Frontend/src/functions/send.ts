import axios from 'axios';

const api = axios.create({
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
        const response = await api.post('/login', {
            email: email,
            password:password
        });
        return response.data;
    } catch (error) {
        console.error('Failed to Login', error);
        throw error;
    }
}

export async function checkLoggedin(){
    try{
        const response:any = await api.get("/loggedin")
        if (response.loggedin == true){
            return true
        }else{
            return false
        }
    }catch(err){
        console.log(err)
    }
    
}