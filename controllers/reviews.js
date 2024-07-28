const Campground = require('../models/campground'); 
const Review = require('../models/review');

module.exports.postReview = async(req, res) =>{
    //req.params.id而不是req.body.id是因为是从url中获得的
    //req.params.id 的 id 即路径/:id 的 id,名称需相同，如果路径里是/:campId, 则req.params.campId
    //req.params 包含了路由路径中的动态参数
    const campground = await Campground.findById(req.params.id);
    //req.body 包含通过 HTTP 请求发送的请求体中的数据
    //比如post请求提交的数据
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteReview = async(req, res) =>{
    const {id, reviewId} = req.params;
    //delete from campground(ref) first
    //$pull 是 mongodb 的一个operator, 语法{<operator1>: { <field1>: <value1>}}
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    //delete from reviews collection
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Deleted review!');
    res.redirect(`/campgrounds/${id}`);
}