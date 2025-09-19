import ReactMarkdown from "react-markdown";

interface requirement{
    sender: "user" | "agent"
    username: string
    pfp?: string
    content: string
}

export function Messagecard(sender: requirement){
    return <div className="inline-flex flex-row items-center gap-3 bg-[#BBDCE5]
     rounded-2xl p-3  ">

        {sender.sender == "user" ? <img src="https://static.wikia.nocookie.net/eb6be2ef-39ef-4a9a-9470-6465e2292a11/scale-to-width/755" className="w-12 rounded-full "></img> :
        <img src="https://pm1.aminoapps.com/7150/1959c1d7292d323da5166cd92d3d0b48c7525289r1-1242-1191v2_hq.jpg" className="w-12 rounded-full">

        </img> }
        <div className="flex flex-col">
            <p className="text-sm"> {sender.sender == "user" ?sender.username:sender.sender == "agent" ? "Collab AI" : null } </p>

            {sender.sender == "user" ? <p>{sender.content}</p> : <ReactMarkdown>{sender.content}</ReactMarkdown>}
        </div>
        
    </div>
}


