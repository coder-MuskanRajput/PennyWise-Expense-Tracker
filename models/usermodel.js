const mongoose = require("mongoose");
const plm = require('passport-local-mongoose');

const usermodel = new mongoose.Schema({
    username :{
       type:String,
       unique: true,
       require: true
    },
    email: String,
    password : String,
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }],
    add :[
       
    ],
    forgetPasswordOtp :{
        type: Number,
        default : -1
    }
})
usermodel.plugin(plm)
module.exports = mongoose.model("User" , usermodel)

