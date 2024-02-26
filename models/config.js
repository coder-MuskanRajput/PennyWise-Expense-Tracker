const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB)
.then(()=>console.log("Database Connected"))
.catch((err) => console.log(err.message))               