"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Home, FolderOpen, LogIn, User } from "lucide-react"

export function Header() {
  const { user } = useAuth()

  return (
    <div className="flex flex-row gap-3.5 justify-between border-2 p-4 rounded-xl bg-[#D9C4B0]/90 backdrop-blur-sm w-[90%] h-[10%] items-center shadow-lg">
      <div className="flex flex-row gap-3.5">
        <Link
          to="/"
          className="cursor-pointer bg-[#CFAB8D]/80 hover:bg-[#CFAB8D] rounded-lg px-4 py-2 font-montserrat transition-all duration-200 hover:shadow-md flex items-center gap-2 backdrop-blur-sm"
        >
          <Home size={16} />
          Home
        </Link>

        {user === true ? (
          <Link
            to="/projects"
            className="cursor-pointer bg-[#CFAB8D]/80 hover:bg-[#CFAB8D] rounded-lg px-4 py-2 font-montserrat transition-all duration-200 hover:shadow-md flex items-center gap-2 backdrop-blur-sm"
          >
            <FolderOpen size={16} />
            Projects
          </Link>
        ) : null}
      </div>

      <div className="flex flex-row justify-center items-center font-semibold font-montserrat text-xl text-gray-950 gap-2">
        <h1 className="text-balance">Colab Minds AI</h1>
      </div>

      <div className="justify-center items-center">
        {user === false ? (
          <Link
            to="/Login"
            className="cursor-pointer bg-[#CFAB8D]/80 hover:bg-[#CFAB8D] rounded-lg px-4 py-2 items-center transition-all duration-200 hover:shadow-md flex gap-2 backdrop-blur-sm font-montserrat"
          >
            <LogIn size={16} />
            Login
          </Link>
        ) : user === true ? (
          <button type="button" className="relative group">
            <div className="w-12 h-12 rounded-full bg-[#CFAB8D]/80 backdrop-blur-sm border-2 border-[#CFAB8D] flex items-center justify-center transition-all duration-200 hover:shadow-lg group-hover:bg-[#CFAB8D]">
              <User size={20} className="text-gray-700" />
            </div>
          </button>
        ) : null}
      </div>
    </div>
  )
}
