import { useEffect, useState } from "react"
import { api } from "../functions/send"

interface ProjectItem {
    _id: string
    name: string
    description?: string
    createdAt?: string
    updatedAt?: string
}

export default function useContent(): ProjectItem[] {
    const [content, setContent] = useState<ProjectItem[]>([])

    useEffect(() => {
        api.get("/project")
            .then((response) => {
                setContent(response.data)
            })
            .catch((err) => {
                console.error("[useContent] failed to load projects:", err)
            })
    }, [])

    return content
}