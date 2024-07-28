const express = require('express');
const router = express.Router({mergeParams: true});
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const { storeReturnTo } = require('../middleware');
const usersController = require('../controllers/users');

//register a new user
router.route('/register')
    .get(usersController.renderRegister)
    .post(catchAsync(usersController.register));


//user log in
router.route('/login')
    .get(usersController.renderLogin)
    //验证用户使用passport提供的中间件authenticate：passport.authenticate('strategy', {...})
    //不同的stratey，比如google，facebook等需创建不同的route
    .post(
        // use the storeReturnTo middleware to save the returnTo value from session to res.locals
        storeReturnTo,
        // passport.authenticate logs the user in and clears req.session
        passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
        // Now we can use res.locals.returnTo to redirect the user after login
        usersController.login
    );


//log out
router.get('/logout', usersController.logout);

module.exports = router;