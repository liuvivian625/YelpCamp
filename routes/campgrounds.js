const express = require('express');
const router = express.Router();
//..回到上一级目录
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isAuthor, validateCampground} = require('../middleware.js');
const campgroundsController = require('../controllers/campgrounds.js');
const multer  = require('multer');//处理 form 的 enctype="multipart/form-data"
const {storage} = require('../cloudinary/index.js');//可省略/index.js，因为node会自动搜索index.js文件
const upload = multer({storage});//sets upload destination


//相同的route，可以用router.route() chain在一起
router.route('/')
    //go to display all campgrounds page
    //router.get() 定义了一个处理 GET 请求的路由，当客户端请求 /campgrounds 路径时，这个路由处理器会被执行
    //这里的完整路径是localhose:3000/campgrounds
    //一个路径只能有一个对应的视图
    .get(catchAsync(campgroundsController.index))
    //create a new campground
    //因为validateCampground是middleware，所以直接作为一个参数传给router.post()即可
    //不用写在async的内部
    //在这里加 isLoggedIn 是为了避免user通过postman等方式access route
    .post(
        isLoggedIn, 
        upload.array('image'), //image应匹配 form中对应input的name
        validateCampground, 
        catchAsync(campgroundsController.createNewCampground)
    );


//router.get('/', catchAsync(campgroundsController.index));

//go to new campground page 
router.get('/new', isLoggedIn, campgroundsController.renderNewForm);

//router.post('/', isLoggedIn, validateCampground, catchAsync(campgroundsController.createNewCampground));

router.route('/:id')
    //show a campground
    //这个route必须在new之后，否则会把new当成一个id进行搜索
    .get(catchAsync(campgroundsController.showCampground))
    //edit a campground
    //edit-put
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgroundsController.editCampground))
    //delete a campground
    .delete(isLoggedIn, isAuthor, catchAsync(campgroundsController.deleteCampground));

//edit a campground
//edit-get: render edit form
//中间件有顺序，isAuthor is after isLoggedIn
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgroundsController.renderEditForm));



module.exports = router;