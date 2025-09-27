import { useRef} from "react"
import { Header } from "../components/header"
import { sendLogin } from "../functions/send";
import { useNavigate } from "react-router-dom";
import toast, {Toaster} from "react-hot-toast"

function Login(){
    const navigate = useNavigate();

    const emailRef = useRef<HTMLInputElement>(null);;
    const passRef = useRef<HTMLInputElement>(null);;

    async function handleinput() {
        const email = emailRef.current?.value ?? "";
        const password = passRef.current?.value ?? "";

        try{
            const {res, status} = await sendLogin(email, password); 

            console.log(status)

            if(status == 200){
                navigate("/");
            }
            else{
               toast.error(res.message, {
                style: {
                    border: '1px solid #713200',
                    padding: '16px',
                    color: '#713200',
                },
                iconTheme: {
                    primary: '#713200',
                    secondary: '#FFFAEE',
                },
                });
            } 
        }catch(err){
            console.log(err);
        };
    }
    
    function onInputKeyHandler(e:React.KeyboardEvent<HTMLInputElement>){
        if(e.key === "Enter"){
           passRef.current?.focus(); 
        }
    }
    function onInputKey(e:React.KeyboardEvent<HTMLInputElement>){
        if(e.key === "Enter"){
            handleinput()
        }
    }


    return <div className="flex flex-col grow p-6 gap-10  items-center align-middle  h-screen w-screen bg-[#ECEEDF]">
        <Toaster
            position="bottom-right"
            reverseOrder={false}
        />
        <Header/>

        <div className="flex flex-col w-full h-full items-center justify-center">
            <div className="flex flex-col font-mono justify-between items-center w-[50%] h-[80%] gap-6 p-6 bg-[#D9C4B0] rounded-4xl">
                <h1 className="text-2xl p-2">
                    Login
                </h1>
                <div className="flex flex-col gap-6 items-center justify-center text-[16px]" >

                    <div className="flex flex-row bg-[#CFAB8D] rounded-lg items-center justify-center px-4 py-2 text-[16px]">
                        <h3>Email: </h3>
                        <input 
                        type="text"
                        placeholder="Enter Your Email"
                        className="focus:outline-0 p-4"
                        ref={emailRef}
                        onKeyUp={onInputKeyHandler}/>
                    </div>
                    
                    <div className="flex flex-row bg-[#CFAB8D] rounded-lg items-center justify-center px-4 py-2 text-[16px]">
                        <h3>Password: </h3>
                        <input 
                        type="password"
                        placeholder="Enter Your Email"
                        className="focus:outline-0 p-4"
                        ref={passRef}
                        onKeyUp={onInputKey}/>
                    </div>

                </div>
                
                <button className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5 items-center w-fit h-fit" onClick={handleinput}>
                    Login
                </button>
            </div>
        </div>
        
    </div>
};

export default Login