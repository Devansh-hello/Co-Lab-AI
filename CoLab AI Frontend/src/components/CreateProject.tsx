import {useRef, useState} from "react";
import { MyButton } from "./MyButton";
import {api} from "../functions/send"

interface projectmodal {
    open: boolean;
    onclose?:boolean
}

const projectNameRef = useRef<HTMLInputElement>(null)
const projectDescriptionRef = useRef<HTMLInputElement>(null)
const {done, setdone}:boolean = useState()
const {loading, setLoading} = useState<boolean>(false)

async function createProject(){
    const name = projectDescriptionRef.current?.value;
    const description = projectDescriptionRef.current?.value;

    try{
        setLoading(true)

        const result = await api.post("/create-project", {
            name,
            description
        })

        if(result.status == 200){
            setdone(true)
            setLoading(false)
        }
    }catch(err){
        
    }
    

}

export function CreateProjectModal({ open, onclose}: projectmodal){
    return <div>
        {open && 
        <div className=" flex w-screen h-screen bg-[#00000050] fixed ">  
            <div className="flex  justify-center items-center  w-full h-full">
                <div className=" bg-[#ECEEDF] flex flex-col p-8 gap-4 rounded-xl w-[30%]">
                    <div className="flex flex-row justify-between bg-[#cfab8d82] p-4 rounded-lg">

                        <h1 className="font-montserrat text-xl font-medium">Create Project
                        </h1>

                        <img 
                        className="hover:cursor-pointer"
                        src="https://img.icons8.com/ios/50/delete-sign--v1.png" 
                        width={30} 
                        height={10}
                        
                        />

                    </div>
                    

                    <div className="flex flex-col gap-2">
                        <h3 className="font-SourceCodePro text-[#1f1e1e]">
                            Project Name
                        </h3>
                        <input className="border-1 rounded-lg p-2 font-SourceCodePro" placeholder="Enter Your Project Name" ref={projectNameRef}/>

                        <h3 className="font-SourceCodePro text-[#1f1e1e]">
                            Description
                        </h3>

                        <input className="border-1 rounded-lg p-2 font-SourceCodePro" placeholder="Enter Your Project Description" ref={projectDescriptionRef}/>

                        
                    </div>
                    
                    <MyButton content="Create" />
                    
                </div>

            </div>
        </div>}
    </div>

}