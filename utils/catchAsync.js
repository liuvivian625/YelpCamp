//wrap function for async error handling
//wraps try/catch/next in async function in app.js
//该wrap function 的参数是一个方法，即app.js中的asnyc方法
function catchAsync(fn) {
    //返回一个匿名function,该方法接受三个参数(req, res, next)
    return function (req, res, next) {
        //catch会捕获fn throw的任何error
        fn(req, res, next).catch(e => next(e))
    }
}

module.exports = catchAsync;