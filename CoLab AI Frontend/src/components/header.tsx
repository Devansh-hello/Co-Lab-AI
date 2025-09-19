import { Link } from "react-router-dom";
import {checkLoggedin} from "../functions/send"


export function Header(){
    let user:any = checkLoggedin
    user = false;
    return<div 
    className="flex flex-row gap-3.5 justify-between border-2 p-4 rounded-md bg-[#D9C4B0] w-[100%] h-[10%] items-center">
        <div 
        className="flex flex-row gap-3.5">

            <Link to={"/"}
            className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5">
                Home
            </Link>

            {user == true ?<Link to={"/chat"}
            className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5">
                Chat
            </Link> : null}

        </div>

        <div 
        className="justify-center items-center font-bold font-mono text-xl text-gray-950">

            <h1>
                Colab Minds AI
            </h1>

        </div>

        <div className="justify-center items-center ali">

            {user == false ?<Link to={"/Login"}
            type="button" 
            className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5 items-center">
                Login
            </Link>:
            <button
            type="button">

                <img  
                src="https://static.wikia.nocookie.net/eb6be2ef-39ef-4a9a-9470-6465e2292a11/scale-to-width/755"
                className="w-12 rounded-full "/>

            </button>}

        </div>
        
    </div>
}