import { useState, type ReactEventHandler } from "react"
import { Header } from "../components/header"

function Login(){
    let [password, setPassword] = useState("");

    function getPassword(e:React.ChangeEvent<HTMLInputElement>){
        setPassword(e.target.value)
    }
    async function handleinput() {
            try{
                await 
                setPassword("");
            }catch(err){
                console.log(err);
            };
        }
    
        function onKeyHandler(e:React.KeyboardEvent<HTMLInputElement>){
            if(e.key === "Enter"){
                handleinput()
            }
        }


    return <div className="flex flex-col grow p-6 gap-10  items-center align-middle  h-screen w-screen bg-[#ECEEDF]">
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
                        className="focus:outline-0 p-4"/>
                    </div>
                    
                    <div className="flex flex-row bg-[#CFAB8D] rounded-lg items-center justify-center px-4 py-2 text-[16px]">
                        <h3>Password: </h3>
                        <input 
                        type="text"
                        placeholder="Enter Your Email"
                        className="focus:outline-0 p-4"
                        value={password}
                        onChange={getPassword}
                        onKeyUp={onKeyHandler}/>
                    </div>

                </div>
                
                <button className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5 items-center w-fit h-fit" >
                    Login
                </button>
            </div>
        </div>
        
    </div>
};

export default Login