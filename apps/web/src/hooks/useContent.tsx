"use client";

import { useEffect, useState, useCallback } from "react"
import { api } from "../functions/send"

interface ProjectItem {
    _id: string
    name: string
    description?: string
    createdAt?: string
    updatedAt?: string
}

export default function useContent() {
    const [content, setContent] = useState<ProjectItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refetch = useCallback(() => {
        setIsLoading(true)
        api.get("/project")
            .then((response) => {
                setContent(response.data)
            })
            .catch((err) => {
                console.error("[useContent] failed to load projects:", err)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [])

    useEffect(() => {
        refetch()
    }, [refetch])

    return { projects: content, isLoading, refetch }
}
