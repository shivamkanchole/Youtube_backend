import connectDB from './db/index.js'
import dotenv from 'dotenv'

dotenv.config({ // we are doing this so that on loading of our aplication as soon as possible hmare env varriable har kisi ko available ho jaye
    path:'./env'
})


connectDB();