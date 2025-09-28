import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export function Header(){

    const {user} = useAuth()
    return<div 
    className="flex flex-row gap-3.5 justify-between border-2 p-4 rounded-md bg-[#D9C4B0] w-[90%] h-[10%] items-center">
        <div 
        className="flex flex-row gap-3.5">

            <Link to={"/"}
            className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5 font-montserrat">
                Home
            </Link>

            {user == true ?<Link to={"/projects"}
            className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5 font-montserrat">
                Projects
            </Link> : null}

        </div>

        <div 
        className=" flex flex-row justify-center items-center font-medium font-montserrat text-xl text-gray-950 gap-2">
            <img src="https://media.discordapp.net/attachments/1084257517229592659/1421561764872454174/281425e4-4e94-475a-a488-740a0fd95d50-removebg-preview1.png?ex=68d97c10&is=68d82a90&hm=fecc2ecc733f7afe10921f27da86e999a20848849579b8d7c0bc77fa59948846&=&format=webp&quality=lossless&width=883&height=883" width={40}/>

            
            <h1>
                Colab Minds AI
            </h1>

        </div>

        <div className="justify-center items-center ali">

            {user === false ?<Link to={"/Login"}
            type="button" 
            className="cursor-pointer bg-[#CFAB8D] rounded-lg px-3 py-1.5 items-center">
                Login
            </Link>:user === true ?
            <button
            type="button">

                <img  
                src="https://static.wikia.nocookie.net/eb6be2ef-39ef-4a9a-9470-6465e2292a11/scale-to-width/755"
                className="w-12 rounded-full "/>

            </button>: null}

        </div>
        
    </div>
}