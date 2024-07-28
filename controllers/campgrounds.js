//controllers: used to move some codes from camgrounds routes here so routes js is not crowded

const Campground = require('../models/campground');
const {cloudinary} = require('../cloudinary/index');
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_CLOUD_KEY;

module.exports.index = async (req, res) => {
    //查询数据库中的 Campground 集合
    const campgrounds = await Campground.find({});
    //res.render(view, data) 
    //view 视图模板的路径, 相对于 views 目录
    //data 传递给视图模板的数据对象, 模板引擎ejs会使用这些数据来动态生成最终的 HTML
    //data 可以有多个，比如 {campgrounds, news, reviews}
    //注意这里的路径开头没有/,因为render默认去views目录中搜索view, 这里搜索的是views/campgrounds/index
    //如果加了/，表示从root目录开始找，/campgrounds/index变成了YelpCamp下搜索campgrounds/index
    res.render('campgrounds/index', { campgrounds });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.createNewCampground = async(req, res, next)=>{
    //通过maptilerClient API把String的location转成geoData
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    //const geoData = await maptilerClient.geocoding.forward("Yosemite, CA", { limit: 1 });
    //console.log(geoData);
    const campground = new Campground(req.body.campground);
    campground.images = req.files.map(f=>({url: f.path, filename: f.filename}));
    campground.author = req.user._id;//req.user 是由 Passport 中间件设置的，通过了passport验证
    //通过API，获得geoJSON信息存在campground.geometry中
    campground.geometry = geoData.features[0].geometry;
    console.log(campground);
    await campground.save(); //保存到数据库
    req.flash('success', 'Hooray! A new campground is created!')
    res.redirect(`/campgrounds/${campground._id}`)
    //要显示flash message，因为redirect了，所以去get(redirect对应的路由)处修改
}

module.exports.showCampground = async(req, res, next) => {
    //findById()的参数即get请求的id，可通过req.params.id获得
    //populate('reviews') 是把原本ObjectId形式的review变成具体的信息，不影响生产campgroud对象
    //即本来campgroud对象的reviews中存的是ObjectId，现在变成了具体信息。
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate:{
            path: 'author' //populate 所有 reviews 的 author
        }//实际不会一下populate所有的，会设置为一次populate 20个或50个，并结合翻页或scroll
    }).populate('author'); //populate 当前 campground 的 author
    //if didn't find the campground
    if(!campground){
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditForm = async(req, res) => {
    const campground = await Campground.findById(req.params.id);
     //if didn't find the campground
     if(!campground){
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground })
}

module.exports.editCampground = async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    campground.set(req.body.campground);
    
    //update location
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    campground.geometry = geoData.features[0].geometry;

    const imgs = req.files.map(f=>({url: f.path, filename: f.filename}));
    campground.images.push(...imgs);//push to the images array
    await campground.save();

    //delete images
    if(req.body.deleteImages){
        const deleteImages = req.body.deleteImages;
        console.log(deleteImages);
        //删除cloudinary上的图片
        for(let filename of deleteImages){
            //cloudinary的方法
            cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({$pull:{images:{filename:{$in: req.body.deleteImages}}}});
        
    }
    
    req.flash('success', 'Updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async(req, res) =>{
    //findByIdAndDelete() triggers findOneAndDelete() 这个middleware
    //所以在campground.js中post中传递的是findOneAndDelete()
    const campground = await Campground.findById(req.params.id);
    //删除cloudinary上的图片
    for(let image of campground.images){
        cloudinary.uploader.destroy(image.filename);
    }
    await Campground.findByIdAndDelete(req.params.id);
    req.flash('success', 'Deleted campground!');
    res.redirect('/campgrounds');
}