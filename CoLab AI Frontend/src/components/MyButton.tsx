type MyButtonProps = {
  content: string;
  image?: string;
  width?: number,
  onclick?: React.MouseEventHandler<HTMLButtonElement>

};


export function MyButton({ content, image, onclick, width }: MyButtonProps){
    return <button className="inline-flex justify-center items-center bg-[#D9C4B0] p-4 rounded-lg h-[60%] hover:cursor-pointer gap-2 font-montserrat" onClick={onclick}>

        {image? <img src={image} width={width}/> :null}
        {content}

    </button>
}