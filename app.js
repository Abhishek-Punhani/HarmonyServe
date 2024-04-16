
if(process.env.NODE_ENV !="production"){
    require("dotenv").config();
}
const express=require('express');
const app=express();
const mongoose=require('mongoose');
const methodOverride = require('method-override');
const ejsMate=require("ejs-mate");
const Product=require('./models/product.js');
const Review=require('./models/review.js');
const multer=require('multer');
const path=require("path");
const dbUrl=process.env.ATLAS_LINK;

const session=require("express-session");
const {storage}=require("./CloudConfig.js");
const upload=multer({storage});
const ExpressError=require("./ExpressError.js");
const {listingSchema,reviewSchema}=require("./Schema.js");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local").Strategy;
const MongoStore=require("connect-mongo");
const User=require("./models/user.js")
app.set("views",path.join(__dirname,"/views"));
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set("view engine","ejs");

app.engine("ejs",ejsMate);

app.use(express.static("public"));
app.use(express.static(path.join(__dirname,"public/")));
const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600
    })    
   
const sessionObject={
    store,
    secret:"mysecret12333",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,

    }
}
const isAuthor=async (req,res,next)=>{
	let {reviewid,id}=req.params;
	let review=await Review.findById(reviewid);
	if(!review.author.equals(res.locals.currUser._id)){
		req.flash("err","You are not author of this review!");
		return res.redirect(`/listings/${id}`);
	}
	return next();
}
app.use(session(sessionObject));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
main()
.then( ()=>{
    console.log("connected to db");
})
.catch((err)=>console.log(err));

async function main(){
    await mongoose.connect(dbUrl);
}
// function asyncWrap(fn){
//     return function(req,res,next){
//         fn(req,res,next).catch((err)=> next(err));
//         };
//     }
function asyncWrap(fn) {
    return function(req, res, next) {
        const result = fn(req, res, next);
        // Check if the result is a promise
        if (result instanceof Promise) {
            result.catch((err) => next(err));
        }
    };
}
const validateListing=(req,res,next)=>{
let {error}=listingSchema.validate(req.body.listings);
if(error){
    throw new ExpressError(400,error);
}else{
   return next();
}
}
const validateReview=(req,res,next)=>{
   
    let {error}=reviewSchema.validate(req.body);
if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
}
else{
   return next();
}
}

const isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("err","You must be Logged in!");
       return res.redirect("/login");
    }
   return next();
}
const saveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
		res.locals.redirectUrl=req.session.redirectUrl;
	}
	return next();
}
const search=async(req,res,next)=>{
    if(req.query.query&&req.query.query!=""){
       let q=req.query.query;
    
   
   if(q){
   
        let products=await Product.find();
        products= products.filter((project) => (
            project.title.toLowerCase().includes(q.toLowerCase())
        ))
        return res.render('store.ejs',{products});
    
    
}}else{     
        return  next()
}
}

app.use((req,res,next)=>{
    res.locals.suc=req.flash("suc");
    res.locals.sucdel=req.flash("sucdel");
    res.locals.err=req.flash("err");
    res.locals.currUser=req.user;
     if(!(req.session.cart)) req.session.cart=[];
  return  next();
})

app.get('/signup',asyncWrap(async(req,res)=>{
   return res.render("users/signup.ejs");
}))
app.post('/signup',asyncWrap(async(req,res)=>{
    try{
        let {username,email,pass}=req.body;
    let newUser=new User({email,username});
    await User.register(newUser,pass);
    
    req.login(newUser, (err) => {
        if(err) {
            return next(err);
        }
        req.flash("success", "Welcome to Harmony Serve!");
       return res.redirect("/home");
    });
    }catch(e){
        req.flash("err",e.message);
     return   res.redirect("/signup");
    }
}))

app.get('/login',asyncWrap(async(req,res)=>{
   return res.render("users/login.ejs");
}))
app.post('/login',saveRedirectUrl,passport.authenticate("local",{
    failureRedirect:"/login",
    failureFlash:true,
    
}),asyncWrap(async(req,res)=>{
    req.flash("suc","Welcome to HarmonyServe");
    let redirectUrl=res.locals.redirectUrl ||"/home";
  return  res.redirect(redirectUrl);
}))
app.get('/logout',saveRedirectUrl,asyncWrap(async(req,res)=>{
    req.logout((err)=>{
        if(err){
         return   next(err);
        }
     req.flash("sucdel","You are Logged out!");
     let redirectUrl=res.locals.redirectUrl ||"/home";
   return  res.redirect(redirectUrl);           
    })
}))
app.get('/home',asyncWrap((req,res)=>{
   return res.render("main.ejs");
}))
app.get('/about',asyncWrap((req,res)=>{
   return res.render("about.ejs");
}))
app.get('/ShikshaSaathi',(req,res)=>{
    return res.render("ShikshaSaathi.ejs");
})
app.get('/AnnapurnaSeva',(req,res)=>{
    return res.render("AnnapurnaSeva.ejs");
})
app.get('/ShikshaSaathi/apply',(req,res)=>{
    req.flash("suc","Applied Successfully, We will reach you out soon on your registered email");
    return res.redirect("/ShikshaSaathi");
})
app.post('/apply',saveRedirectUrl,(req,res)=>{
    req.flash("suc","Applied Successfully, We will reach you out soon on your registered email");
    let redirectUrl=res.locals.redirectUrl ||"/home";
    return  res.redirect(redirectUrl);    
})

app.get('/store',search,asyncWrap(async(req,res)=>{
   
    let products =await Product.find();
   return res.render("store.ejs",{products});
}))
app.get('/store/cart',asyncWrap(async(req,res)=>{
    if(req.session.cart.length){
       const cart = await Product.find({ _id: { $in: req.session.cart } }).populate({path:"review",populate:{path:"author"}}).populate("owner");
       let sum=0;
       if(cart.review){
        for(el of cart.review){
            sum+=el.rating;
           }
           sum/=cart.review.length;
       }
       let price=0;
      if(cart.length){
        for(el of cart){
            price+=el.price;
           }
      }
       res.render("cart.ejs",{products:cart,sum,price});
    }else{
        
       res.render("cart.ejs",{products:[]});
    }
   }))
   app.post('/store/cart/:id',asyncWrap(async(req,res)=>{
   const {id}=req.params;
   const product=await Product.findById(id);
   let cart=req.session.cart;

cart = cart.splice(cart.indexOf(product), 1);
    res.redirect("/store/cart");

}))
app.get('/store/checkout',isLoggedIn,(req,res)=>{
    res.render("checkout.ejs");
})
app.post('/store/checkout',isLoggedIn,(req,res)=>{
   req.flash("suc","Order Successfully Placed!");
   res.redirect("/store"); 
})

app.post('/store',upload.single('url'),isLoggedIn,asyncWrap(async(req,res)=>{
   let {path,filename}=req.file;
   let product=req.body.listings;
   product.image={url:path,filename:filename};
  
   let result=listingSchema.validate(product);
   if(result.error){
    throw new ExpressError(400,result.error);
}
product.owner=res.locals.currUser._id;
   const newproduct=new Product(product);
   
   await newproduct.save();
   req.flash("suc","Listing Created successfully!");
  return  res.redirect("/store");
}))
app.patch('/store/:id',upload.single('url'),asyncWrap(async(req,res)=>{
    let {id}=req.params;
    let editproduct=req.body.listings;
    
   let product=await Product.findByIdAndUpdate(id,{...editproduct});
   if(typeof req.file !=="undefined"){
    let {path,filename}=req.file;
product.image={url:path,filename:filename};
}

let result=listingSchema.validate(editproduct);
       
    if(result.error){
        throw new ExpressError(400,result.error);
    }
await product.save();
req.flash("sucdel","Listing was Edited!");
   return res.redirect(`/store/${id}`);
 }))
 app.delete('/store/:id',asyncWrap(async(req,res)=>{
    let {id}=req.params;
    await Product.findByIdAndDelete(id);
    req.flash("sucdel","Listing Deleted Sucessfully!");
   return res.redirect("/store");
 }))
app.get('/store/:id',asyncWrap(async(req,res)=>{
    let {id}=req.params;
    const product= await Product.findById(id).populate({path:"review",populate:{path:"author"}}).populate("owner");
   return res.render("show.ejs",{product});
}))
app.get('/store/:id/edit',asyncWrap(async(req,res)=>{
    let {id}=req.params;
    const product= await Product.findById(id);
    let image_url=product.image.url;
    image_url=image_url.replace("/upload","/upload/w_250");
  return  res.render("edit.ejs",{product,image_url});
}))

app.post('/store/:id/cart',saveRedirectUrl,asyncWrap(async(req,res)=>{
    let {id}=req.params;
    let cart =req.session.cart;

    if(cart.includes(id)){
        req.flash("err","Item already added to cart");
        return res.redirect(`/store/${id}`); 
    }
    cart.push(id);
    req.flash("suc","Item added to cart");
    cart=req.session.cart;
    return  res.redirect(`/store/${id}`);   
}))

app.get('/donate',asyncWrap((req,res)=>{
   return res.render("donate.ejs");
}))
app.get('/donation',(req,res)=>{
    res.render("donation.ejs");
})
app.post('/donate',saveRedirectUrl,(req,res)=>{
    req.flash("suc","Donation Successfully Done!");
    let redirectUrl=res.locals.redirectUrl ||"/home";
    return  res.redirect(redirectUrl);    
})

app.get('/new',isLoggedIn,asyncWrap((req,res)=>{
   return res.render("new.ejs");
}))


app.post('/store/:id/reviews',isLoggedIn,validateReview,asyncWrap(async(req,res)=>{
    let product= await Product.findById(req.params.id);
    let newReview=new Review(req.body.reviews);
    newReview.author=res.locals.currUser._id;
    product.review.push(newReview);
    newReview.save();
    product.save();
    
    req.flash("suc","Review added successfully!");
   return res.redirect(`/store/${req.params.id}`);
}))

app.delete('/store/:id/reviews/:reviewid',isLoggedIn,isAuthor,asyncWrap(async (req,res)=>{
    let {id,reviewid}=req.params;
    await Product.findByIdAndUpdate(id,{$pull :{review:reviewid}});
    await Review.findByIdAndDelete(reviewid);
    
req.flash("sucdel","Review deleted successfully!");
   return res.redirect(`/store/${id}`);
}))


app.all("*",asyncWrap((req,res,next)=>{
   return next(new ExpressError(404,"Page Not Found!"));
   }))
app.use((err,req,res,next)=>{
   let {status=501,message="some error occured"}= err;
  return res.render("error.ejs",{message})
   } );
app.listen((8080),()=>{
    console.log("listening to port 8080");
})