if(process.env.NODE_ENV !== "production" ){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
//https://www.passportjs.org/packages/ 可以看到各种strategies，这里是passport-local
const LocalStrategy = require('passport-local');
const ExpError = require('./utils/ExpError');
const User = require('./models/user');//for password
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const MongoStore = require('connect-mongo');
const dbUrlLocal = process.env.DB_URL_LOCAL;


//Deploy: Mongo Altas setting
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelpcampdb';

mongoose.connect(dbUrl)
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    });


const usersRoutes = require('./routes/users');
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');


app.engine('ejs', ejsMate);//tell ejs to use ejsMate engine, not the default engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//定义中间件
app.use(express.urlencoded({ extended: true })); //to parse the body
app.use(methodOverride('_method'));
// By default, $ and . characters are removed completely from user-supplied input in the following places:
// req.body, req.params, req.headers, req.query
app.use(mongoSanitize());
app.use(helmet());

//trusted websites for helmet setting
//可以根据helmet的设置细分为 connectSrc, scriptSrc, styleSrc等
const SrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com",
    "https://api.maptiler.com",
    "https://images.unsplash.com",
    "https://res.cloudinary.com/dxzxptjde/"
];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...SrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...SrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...SrcUrls],
            workerSrc: ["'self'","blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                ...SrcUrls
            ],
            fontSrc: ["'self'"],
        },
    })
);


//Connect-Mongo settings: store sessions in Mongo
const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret: 'thisshouldbeabettersecret!', 
    touchAfter: 24 * 60 * 60,//time period in seconds (这里是24hours), lazy update the session
});

store.on("error", function(e){
    console.log("Session store error", e)
})

//session session 设置
const sessionConfig = { 
    name:'secret', //设置session名字，隐藏session目的，不设置会显示connect.sid
    //secrete 密钥
    secret: 'thisshouldbeabettersecret!', 
    //resave：控制是否在每次请求时都重新保存session
    //true 会在每次请求时都重新保存session，
    //false：只有在session数据在请求期间发生变化时才会保存session。通常设置为 false 以减少不必要的存储操作。
    resave: false, 
    //saveUninitialized 控制是否为未修改的session保存 cookie
    //true：即使新session未修改，也会为其保存 cookie。
    //false：只有在session数据发生变化时才保存 cookie。这通常是更好的选择，因为它减少了未使用session的存储。
    saveUninitialized: true,
    cookie:{
        httpOnly: true, //for security，default is true
        //secure: true, //意思是只在https上运行(localhost不是https)
        expires: Date.now() + 1000*60*60, //60分钟，单位是millisecond
        maxAge: 1000*60*60
    },
    store: store 
}
//使用session中间件
app.use(session(sessionConfig));


//静态文件是无需在服务器端动态生成的文件，可以直接提供给客户端。
//它们包括 HTML、CSS、JavaScript、图像、字体等文件。
//express.static 中间件，用于提供静态文件服务: 设置静态文件目录public
//path.join(__dirname, 'public') 使用 Node.js 的 path 模块将当前文件的目录（由 __dirname 提供）与 'public' 连接起来，形成一个绝对路径。
//这样可以确保无论当前文件从哪个目录运行，这个路径总是正确的，并且指向项目根目录下的 public 文件夹。
//app.use(express.static('public')); 使用相对路径 'public' 作为静态文件目录，如果从其他目录运行app.js会得到错误路径
app.use(express.static(path.join(__dirname,'public')));


//使用passport，因为routes中要使用passport，所以这些passport的代码要写在routes前面
//passport推荐看这个manual：https://github.com/jwalton/passport-api-docs
//a middleware that initialises Passport.
app.use(passport.initialize());
//"If your application uses persistent login sessions, passport.session() middleware must also be used." 
//Should be after your session middleware，即app.use(session(...))
//即User log in 后 保持登录状态一段时间
app.use(passport.session());
//Configure a strategy
passport.use(new LocalStrategy(User.authenticate()));
//序列化存储，store User in session，将user对象转换为简单的二进制格式或文本格式（如user id）存储在session中
passport.serializeUser(User.serializeUser());
//反序列化，即将session中的序列化的user id转换为用户对象
passport.deserializeUser(User.deserializeUser())


//使用flash
app.use(flash());
app.use((req,res,next)=>{
    //要得到currentUser需启动passport，因此该中间件需在passport之后
    //存到res.locals是为了视图模版views可以access这些对象
    res.locals.currentUser = req.user; //每个views都会使用该中间件，所以navbar.ejs可以access currentUser
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})


//routes
app.use('/', usersRoutes);
app.use('/campgrounds', campgroundsRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);



//定义路由
app.get('/', (req, res) => { //处理根 URL (/) 的 GET 请求的路由
    //渲染并返回名为 home 的视图模板，这里参数是home页面所在到路径，省略views/和.ejs
    res.render('home');
    //res.send('message') //只是简单地把message文字传到指定的路径页面上
});

//404处理需放在各种routing之后
//即上述各种routing都不满足之后，运行以下这个404代码
app.all('*', (req, res, next)=>{
    //pass to next是为了可以继续执行下面的error handler
    next(new ExpError("Page Not Found", 404));
})

//error handler
app.use((err, req, res, next) => {
    const {statusCode=500} = err;
    if(!err.message){
        err.message = "Something went wrong"
    }
    res.status(statusCode).render('error', {err});
})

//以上是路由和中间件的定义，设置好后再listen启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`APP IS LISTENING ON PORT ${port}`)
});