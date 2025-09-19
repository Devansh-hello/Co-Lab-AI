import { useRef, useState } from "react"
import { sendMessage } from "../functions/send"

export function Messagebox(){
    
    let [inputText, setInputText] = useState("");

    function getInput(e:React.ChangeEvent<HTMLInputElement>){
        setInputText(e.target.value)
    }

    async function handleinput() {
        try{
            await sendMessage(inputText);
            setInputText("");
        }catch(err){
            console.log(err);
        };
    }

    function onKeyHandler(e:React.KeyboardEvent<HTMLInputElement>){
        if(e.key === "Enter"){
            handleinput()
        }
    }

    return<div 
            className="inline-flex flex-row items-center border-2 rounded-full py-3 px-5 justify-center w-auto bg-[#D9C4B0]"
        >

        <input 
            type="text" 
            placeholder="Enter you message here" 
            className="focus:outline-0 w-md items-center justify-center px-8"
            value={inputText}
            onChange={getInput}
            onKeyUp={onKeyHandler}
        >
        </input>

        <button 
            type="button"
            className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5"
            onClick={handleinput}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="-0.5 -0.5 16 16" stroke-linecap="round" stroke-linejoin="round" stroke="#000000" id="Send--Streamline-Mynaui" height="25" width="25">
            <desc>
                Send Streamline Icon: https://streamlinehq.com
            </desc>
            <path d="m8.75 6.25 -1.875 1.875m5.805 -6.230625a0.33437500000000003 0.33437500000000003 0 0 1 0.42500000000000004 0.42562500000000003l-3.7025 10.58125a0.33437500000000003 0.33437500000000003 0 0 1 -0.62125 0.025l-2.011875 -4.52625a0.33375 0.33375 0 0 0 -0.169375 -0.169375l-4.52625 -2.0125a0.33437500000000003 0.33437500000000003 0 0 1 0.025 -0.620625z" stroke-width="1"></path>
            </svg>
        </button>
        
    </div>
}