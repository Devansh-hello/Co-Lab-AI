import { CreateProjectModal } from "../components/CreateProject"
import { MyButton } from "../components/MyButton"
import { Header } from "../components/header"

function ProjectPage(){
    return <>
        <CreateProjectModal open={true} />

        <div className="flex flex-col grow p-6 gap-6 h-screen w-screen bg-[#ECEEDF] items-center">
        
            <Header />
            
            <div className="flex flex-row justify-between items-center p-4 gap-3.5 w-[55%]  rounded-3xl">

                <h1 className=" text-black text-3xl p-4 rounded-2xl font-montserrat text-center justify-center">Your Projects</h1>

                <div className="">
                    <MyButton content="New Project" image="https://img.icons8.com/android/24/plus.png" width={15}/>
                </div>
                
            
            </div>
            
            <div className="flex flex-row p-4 bg-[#edd4c034] rounded-lg w-[50%] h-[10%] justify-between items-center border-[1px] hover:bg-[#edd4c07f] hover:scale-102 hover:cursor-pointer transition delay-150 duration-300 ease-in-out">
                <div>
                    <h1 className=" text-xl font-montserrat">Basic Calculator</h1>
                    <p className="font-SourceCodePro text-[15px]">basic modern Looking functionable calculator app</p>
                </div>
                

                <MyButton content="Edit" image="https://img.icons8.com/ios/50/create-new.png" width={18}/>
            </div>

            <div className="flex flex-row p-4 bg-[#edd4c034] rounded-lg w-[50%] h-[10%] justify-between items-center border-[1px] hover:bg-[#edd4c07f] hover:scale-102 hover:cursor-pointer transition delay-150 duration-300 ease-in-out">
                <div>
                    <h1 className=" text-xl font-montserrat">Basic Calculator</h1>
                    <p className="font-SourceCodePro text-[15px]">basic modern Looking functionable calculator app</p>
                </div>
                

                <MyButton content="Edit" image="https://img.icons8.com/ios/50/create-new.png" width={18}/>
            </div>

        </div>
    </>
}
export default ProjectPage