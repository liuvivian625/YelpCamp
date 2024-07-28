const User = require('../models/user');

module.exports.renderRegister = (req,res)=>{
    res.render('users/register')
}

module.exports.register = async(req, res)=>{
    //用try-catch是为了在/register页面上就可以看到错误信息，而不是跳转到error 页面
    try{
        //解构赋值email，username, password
        const {username, email, password }= req.body;
        //用username和email创建User对象
        const user = new User({username, email});//注意字段要用{}
        //用passport的方法register单独处理password
        //salt+hash
        const registeredUser = await User.register(user, password);
        //不需要 await registeredUser.save();
        //因为 the User.register() method from passport-local-mongoose already saves the user to the database
        //passport提供的方法, register后自动login
        req.login(registeredUser, err=>{
            if(err){
                return next(err);
            }
            req.flash('success', 'Welcome new user!');
            res.redirect('/campgrounds');
        })
    }catch(e){
        //直接在/register页面上显示错误信息
        //passport会自动检测，比如username是否重复等，生成相应的error message
        req.flash('error', e.message);
        res.redirect('/register');
    }
}

module.exports.renderLogin = (req, res)=>{
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = res.locals.returnTo || '/campgrounds'; // update this line to use res.locals.returnTo now
    console.log(`redirectUrl is ${redirectUrl}`);
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res, next)=>{
    //passport提供了logout方法
    req.logout(function(err){
        if(err){
            return next(err);//如果发生错误，则调用 next(err) 传递错误给下一个中间件，比如错误处理中间件
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    })
}