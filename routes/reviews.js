const express = require('express');
//mergeParams: true 将父路由（主程序 app.js）中的参数合并到子路由（当前reviews.js）的 req.params 中
//否则子路由无法获得父路由中 /campgrounds/:id/reviews 里的id
const router = express.Router({mergeParams: true});
const catchAsync = require('../utils/catchAsync');
const {validateReview, isLoggedIn, isReviewAuthor} = require('../middleware');
const reviewController = require('../controllers/reviews');


//post a review
//需要一个路由处理post请求，然后再重定向redirect
router.post('/', isLoggedIn, validateReview, catchAsync(reviewController.postReview));

//delete a review
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviewController.deleteReview))


module.exports = router;