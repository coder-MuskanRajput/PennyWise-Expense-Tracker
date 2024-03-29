var express = require('express');
var router = express.Router();
const USER = require("../models/usermodel");
const EXPENSE = require("../models/expenseModel");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const nodemailer = require("nodemailer");
passport.use(new LocalStrategy(USER.authenticate()));

/* GET home page.*/
router.get('/', function(req, res, next) {
  res.render('index');
});

// Sign up 

router.get("/signup" , function(req,res,next){
  res.render('signup')
})

router.post("/signup", async function (req, res, next) {
  try {
      await USER.register(
          { username: req.body.username, email: req.body.email },
          req.body.password
      );
      req.flash('show', "Successfully registred in PennyWise.")
      res.redirect("/signin");
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

// Signin 

router.get("/signin" , function(req,res,next){
  let response = ""
  req.flash('show').forEach(function(msg){
    response= msg
  });
  // for wrong username or password
  let loginCheck = req.session.messages;
  req.session.messages = null;
  //
  res.render('signin',{response:response , loginCheck: loginCheck})
})

router.post(
  "/signin",
  passport.authenticate("local", {
      successRedirect: "/profile",
      failureRedirect: "/signin",
      failureMessage:true
  }),
  function (req, res, next) {}
);

router.get("/signout", isLoggedIn,function (req, res, next){
  req.logout(() => {
      res.redirect("/signin");
  });
});

router.get("/profile" , isLoggedIn, async function(req,res,next){
   try {
        const exp = await EXPENSE.find();
        let allExp = []
        exp.forEach(function(user){
          if(user.user.toString() === req.user.id){
              allExp.push(user);
          }
        })
        console.log(allExp);
        res.render("profile" , {user: req.user , exp : allExp})
   } catch (error) {
     console.log("Expense add krne m error aaya hai" , error)
     res.send(error)
   }
})


// Mail Function 

async function sendMailer(req,res,user,otp){
  
// admin mail address, which is going to be the sender
const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  auth: {
      user: process.env.GMAIL,
      pass: process.env.PASS,
  },
});

// receiver mailing info
const mailOptions = {
  from: "muskanrajput1510@gmail.com>",
  to: user.email,
  subject: "Reset password otp",
  // text: req.body.message,
  html: `<h1>OTP : ${otp}</h1>`,                           
};

// actual object which intregrate all info and send mail
transport.sendMail(mailOptions, (err, info) => {
  if(err){
    console.log("mail error" , err)
    res.send(err)
  }
  else{
    return;
  }
});
}

// forget route

router.get("/forget" , function(req,res,next){
   let forgetUSER = ""
   req.flash("forgetUSER").forEach(function(msg){
    forgetUSER = msg;
   })
  res.render("forget" , {forgetUSER: forgetUSER})
}) 

router.post('/forget', async function(req, res, next) {

  try {
  const forgetUser = await USER.findOne({email: req.body.email})
  if(!forgetUser){
    req.flash("forgetUSER","This email is not registered")
    res.redirect("/forget")
  }
  else{
    const otp = Math.floor(Math.random() *100000);
    forgetUser.forgetPasswordOtp = otp;
    sendMailer(req,res,forgetUser , otp)
    .then(async()=>{
    await forgetUser.save()
    res.render("otp",{otpResponse : "" , email :forgetUser.email})
  })
  .catch((error) =>{
    console.log("mail ka error ha " , error);
    res.send(error)
   })
  }

  } catch (error) {
    console.log("forget otp me error hai " , error)
  res.send(error)
  }
  });

// match otp

router.post("/matchOtp/:email" , async function(req,res,next){
    try {
      const forgetUser = await USER.findOne({email : req.params.email})
      if(!forgetUser){
        req.flash("forgetUSER" ," This email is not registered")
        res.redirect("/forget")
      }
      // console.log(forgetUser.forgetPasswordOtp);
 else{
      if(forgetUser.forgetPasswordOtp == req.body.otp)
      {
       forgetUser.forgetPasswordOtp = -1;
       await forgetUser.save();
       res.render("resetPassword",{email:forgetUser.email})
      }
      else{
        res.render("otp" ,{otpResponse : "Invalid OTP , Try Again" , email:forgetUser.email })
      //  res.send("Invalid OTP, Try Again") 
      }
    }
    } catch (error) {
      console.log("otp check kro" , error)
      res.send(err)
    }
 })
 
 // reset password

 router.post("/resetPassword/:email", async function(req,res,next){
  try {
    const user = await USER.findOne({email:req.params.email})
    await user.setPassword(req.body.password , async function(err,info){
      if(err){
        console.log(err)
        res.send(err)
      }
      else{
        req.flash("show" , "Recover Password Succcessfully")
        await user.save();
        res.redirect("/signin")
      }

    });
    user.forgetPasswordOtp = -1;
    // res.redirect("/signin")
  } catch (error) {
    console.log(" reset password Error" , error)
    res.send(err)
  }
})

/* GET change password page.*/

router.get("/changePassword" , isLoggedIn ,function(req,res,next){
  res.render("changePassword" )
})

/* POST change password page.*/
 
router.post("/changePassword" , isLoggedIn , async function(req,res,next){
  try {
    await req.user.changePassword(
      req.body.oldpassword,
      req.body.newpassword
    );
    await req.user.save();
    res.redirect("/profile")
  } catch (error) {
     res.send(error)
  }
})

/* GET change Add Expense page.*/


router.get("/addExpenses" , isLoggedIn, function(req,res,next){
  const expenseCategories = [
    'Groceries',
    'Utilities',
    'Rent/Mortgage',
    'Transportation',
    'Entertainment',
    'Dining out',
    'Healthcare',
    'Shopping',
    'Education',
    'Travel',
    'Miscellaneous'
  ];
  
  res.render("addExpenses" ,{categoryList : expenseCategories})
})

/* POST change Add Expense page.*/

router.post("/addExpenses" , isLoggedIn, async function(req,res,next){
  try {
    const expense = await EXPENSE(req.body);
    req.user.expenses.push(expense._id);
    expense.user = req.user.id;

    // req.user.add.push({
    //   amount : req.body.amount,
    //   category : req.body.category
    // });

  //   if(req.body.amount.includes("-")){
  //     req.user.add.push(req.body.amount)

  //   //   req.user.add.push( {
  //   //     // name: false,
  //   //     amount : req.body.amount
  //   // })
  // }
  //   else{
  //     req.user.add.push(req.body.amount)
  //     // req.user.add.push({
  //     //   // name: true,
  //     //   amount : req.body.amount,
  //     // }) 
  //   }

    await expense.save();
    await req.user.save();
    res.redirect("/profile");
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})
 
// Details route

router.get("/details/:id" , isLoggedIn , async function(req,res,next){
   try {
      const data = await EXPENSE.findById(req.params.id)
      // console.log(data)
      res.render("details",{data:data})
   } catch (error) {
    console.log("Details Error" , error)
     res.send(error)
   }
})


// Delete route

router.get("/deleteExpense/:id" , isLoggedIn , async function(req,res,next){
    try {
      const detail = await EXPENSE.findByIdAndDelete(req.params.id)
      req.user.expenses.forEach(function(del ,ind){     
        if(req.params.id === del.toString()){
           req.user.expenses.splice(ind,1)
        }
      })
      await req.user.save()
      res.redirect("/profile")
    } catch (error) {
      console.log("delete ka Error hai", error)
      res.send(error)
    }
})

// update route

router.get("/update/:id" , isLoggedIn, async function(req,res,next){
  const prop = await EXPENSE.findById(req.params.id);
  const expenseCategories = [
    'Groceries',
    'Utilities',
    'Rent/Mortgage',
    'Transportation',
    'Entertainment',
    'Dining out',
    'Healthcare',
    'Shopping',
    'Education',
    'Travel',
    'Miscellaneous'
  ];
  res.render("update" , {prop: prop , categoryList : expenseCategories})
}) 

router.post("/update/:id" , isLoggedIn, async function(req,res,next){
  const upd = await EXPENSE.findByIdAndUpdate(req.params.id ,
    {
       tags: req.body.tags,
       amount : req.body.amount,
       category : req.body.category,
       text : req.body.text,
       date : req.body.date
    });
  await upd.save();
  res.redirect(`/details/${req.params.id}`)
})

// search route

router.get("/filter", async function (req, res, next) {
  try {
      let { expenses } = await req.user.populate("expenses");
      expenses = expenses.filter((e) => e[req.query.key] == req.query.value);
      res.render("profile", {user: req.user , exp : expenses});
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

// is logged in function
 
function isLoggedIn(req, res, next) {
  
  if (req.isAuthenticated()) {
      next();
  } else {
      res.redirect("/signin");
  }
}
module.exports = router;