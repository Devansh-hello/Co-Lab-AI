import "../index.css"
import { Header } from '../components/header'
import { Messagebox } from '../components/messageBox'
import { Messagecard } from '../components/messageCard'

import { Sidebar } from '../components/sidebar'


function App() {

  return <div className='flex flex-row grow p-6 gap-3.5 justify-center align-middle items-center h-screen w-screen bg-[#ECEEDF]'>
    
    <Sidebar></Sidebar>

    <div className='flex flex-col  p-3 gap-3.5 h-full w-full '>

      <Header></Header>
      <div className='flex flex-col overflow-y-auto gap-3 w-auto items-end'>

        <Messagecard sender="user" username='DevZero' content="can you help me with some questions"></Messagecard>
        <Messagecard sender="agent" username='DevZero' content ="yes I can. Can you specify your problem"></Messagecard>
      </div>
      <div className='flex mt-auto justify-center'>
        <Messagebox></Messagebox>
      </div>
      
      
    </div>
  </div>

}

export default App
