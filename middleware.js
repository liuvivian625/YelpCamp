//做成 middleware 可以方便复用

const Campground = require('./models/campground'); 
const Review = require('./models/review'); 
const {campgroundSchema, reviewSchema} = require('./schemas.js'); //joi schemas
const ExpError = require('./utils/ExpError.js');


//the user can go to this page only if logged in
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {//这是passport提供的方法
        //req.originalUrl redirect之前的url
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in');
        return res.redirect('/login'); //不加return，会运行下面的res.render()导致出错
    }
    next();
}  

//Because passport clears session for security (no access to originalUrl),
//need to store the router (where user was before log in) into res.locals.returnTo 
const storeReturnTo = (req, res, next)=>{
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}


//要做成一个middleware而不是普通的方法,参数必须为(req, res, next)
const validateCampground = (req, res, next)=>{
    //基本验证方法
    //if(!req.body.campground){
    //   throw new ExpError('Invalid Campground Data', 400);
    //}
    //使用joi验证，语法：
    //const {error} = joi的schema对象.validate(req.body);
    const {error} = campgroundSchema.validate(req.body);
    if(error){
        //error.details是个array，通过map取出其中的元素
        const msg = error.details.map(el=>el.message).join(',')
        throw new ExpError(msg, 400);
    }else{
        //做成middleware必须包含next
        next();
    }
}

//check if the logged-in user is the campground author
const isAuthor = async(req, res, next)=>{
    const campground = await Campground.findById(req.params.id);
    //equals是Mongoose提供的方法
    if(!campground.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission.');
        return res.redirect(`/campgrounds/${campground._id}`);
    }
    next();
}

//check if the logged-in user is the review author
const isReviewAuthor = async(req, res, next)=>{
    const {id, reviewId} = req.params;
    const review = await Review.findById(reviewId);
    //equals是Mongoose提供的方法
    if(!review.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission.');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

const validateReview = (req, res, next)=>{
    const {error} = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el=>el.message).join(',')
        throw new ExpError(msg, 400);
    }else{
        next();
    }
}


module.exports = {isLoggedIn, storeReturnTo, validateCampground, isAuthor, validateReview, isReviewAuthor};