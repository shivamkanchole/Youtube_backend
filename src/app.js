import Express from "express";
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = Express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(Express.json({ // this is for , when data is coming from "form"
    limit:"16kb"
}))

app.use(Express.urlencoded({ // this is for , when data is coming from "url"
    extended:true,
    limit:"16kb"
}))

app.use(Express.static("Public")) // when we need to store files/imgs/pdfs in locall machine we can put them inside public folder

app.use(cookieParser()) // so that we can do CRUD operations over cookies



app.get('/',(req,res)=>{
    res.send("welcome to the home directory")
})

export {app}