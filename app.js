//jshint esversion:6
require('dotenv').config()
const express=require('express')
const bodyParser=require('body-parser')
const ejs=require('ejs')
const mongoose=require("mongoose")
const session=require('express-session')
const passport=require('passport')
const passportLocalMongoose=require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate')
const https=require("https")
const { url } = require("inspector")

  
const { stringify } = require('querystring')

const app=express()
app.use(express.static('public'))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}))


app.use(session({
  secret: 'keyboard cat ',
  resave: false,
  saveUninitialized: true,
}))
app.use(passport.initialize())
app.use(passport.session())
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true})

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User=new mongoose.model("User",userSchema)
passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile )
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/",function(req,res){
    res.render("home")
})
app.get("/auth/google",
    passport.authenticate('google', { scope: ['profile'] }))
    app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      
      res.redirect('/secrets');
    }
  );
  

  app.get("/pricing",function(req,res){
    res.render("pricing")
  })
app.get("/register",function(req,res){
    res.render("register")
})
app.get("/login",function(req,res){
    res.render("login")
})
// app.get("/secrets", function (req, res) {
//   if (req.isAuthenticated()) {
//     User.findById(req.user.id, function (err, user) {
//       if (err) {
//         console.log(err);
//         res.redirect("/login");
//       } else {
//         console.log(user); // Log the user object to check if it's retrieved successfully
//         if (user) {
//           res.render("profile", { email: user.email });
//         } else {
//           res.redirect("/login");
//         }
//       }
//     });
//   } else {
//     res.redirect("/login");
//   }
// });

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
})

app.get('/userDetails', function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id)
      .then((user) => {
        if (user) {
          res.json({
            username: user.username,
            email: user.email
          });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
      });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});


app.get('/secrets', function (req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id)
      .then((user) => {
        if (user) {
          res.render('profile', { email: user.email });
        } else {
          res.redirect('/login');
        }
      })
      .catch((err) => {
        console.log(err);
        res.redirect('/login');
      });
  } else {
    res.redirect('/login');
  }
});




app.post("/",function(request,res){
  const Email=request.body.email
  const data={
      members:[
          {
              email_address:Email,
              status:"subscribed",
          
              }
          
      ]
  }
  const jsonData=JSON.stringify(data);
  const url="https://us21.api.mailchimp.com/3.0/lists/4c86aa98f7"
  const options={
      method:"POST",
      auth:"albert:d40672d7ed1502e79e93fd05efb5ce16-us21"
  }
  
  const req=https.request(url,options,function(response){
      if(response.statusCode ==200)
        {res.render("success")
    }
    else
    {
      res.render("failure")
    }
  
      response.on("data",function(data){
    
      console.log(JSON.parse(data))
  
      })
  })
  req.write(jsonData)
  req.end();
  
  })
  app.post("/failure",function(req,response)

{
    response.redirect("/")

}) 
app.post("/success",function(req,response)

{
    response.redirect("/")

}) 
    
app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("secrets")
            })
        }
    })
    })
 

app.post("/login",function(req,res){
    
      const user=new User({
        username:req.body.username,
        password:req.body.password
      })
      req.login(user,function(err){
        if(err){
            console.log(err)
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
      })
});
 

app.use(express.static(__dirname + '/public'));

app.listen(3000,function(){
    console.log("server started on port 3000")
})