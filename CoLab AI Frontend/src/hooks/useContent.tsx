import { useEffect, useState } from "react"
import { api } from "../functions/send"

export default function useContent (){
    const [content, setContent] = useState([])

    useEffect(() => {
        api.get("/project").then((respone) => {
            setContent(respone.data)
        })
    },[])

    return content
}