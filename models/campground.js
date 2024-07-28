const mongoose = require('mongoose'); 
const Review = require('./review');
const Schema = mongoose.Schema; //create a shortcut,后面可以用Schema代替mongoose.Schema

const opts = { toJSON: { virtuals: true } };

//在实际项目中，通常会结合使用 Joi 和 Mongoose 进行双重验证。
//Joi 在数据进入应用程序时进行验证，Mongoose 在数据存入数据库时进行验证。
//这种方法可以确保数据的完整性和有效性。

const ImageScheme = new Schema({
    url: String,
    filename: String

})
//virtual 只能设置在schema上，所以这里为了给image设置virtual属性，创建了ImageSchema
//虚拟属性（virtuals）是 Schema 中定义的一种特殊属性，它们并不会实际存储在数据库中，而是基于文档的其他数据动态计算出来的。
//虚拟属性可以在需要时被读取或者设置，但它们不会影响到实际存储在数据库中的数据。
//虚拟属性的常见用途包括格式化数据、组合字段、生成动态内容等。

//cloudinary 有个transformation API，可以通过修改cloudinary上image的url获取缩略图，比如在/upload后添加/w_200 表示200x200的缩略图
//比起获取原始尺寸再通过css改成缩略图更快
// https://res.cloudinary.com/dxzxptjde/image/upload/w_200/v1721806628/YelpCamp/ewoy6dbdul2e2zv723gw.jpg
// Schema名.virtual('virtual属性名').get(callback function)
ImageScheme.virtual('thumbnail').get(function(){
    return this.url.replace('/upload','/upload/w_200')
})

const CampgroundSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        min: 0,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    //GeoJSON 格式，是一种用于表示地理数据的开放标准格式，
    //point 点： 表示一个单一的地理位置，如下
    //{"type": "Point", "coordinates": [102.0, 0.5]} //coordinates是个array
    geometry:{
        type:{
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates:{
            type: [Number],
            required: true
        }
    },
    images: [ImageScheme],
    description: {
        type: String,
        required: true
    },
    author:{ 
        type: Schema.Types.ObjectId, //创建campground的user的id
        ref: 'User'
    },
    reviews:[{
        type: Schema.Types.ObjectId,
        ref: "Review"
    }]
}, opts);

/*
properties:{
    popUpMarkup: '<h3>Diamond River</h3>'
}
*/
//By default, Mongoose does not include virtuals when you convert a document to JSON
//To include virtuals in res.json(), you need to set the toJSON schema option to { virtuals: true }.
//https://mongoosejs.com/docs/tutorials/virtuals.html
CampgroundSchema.virtual('properties.popUpMarkup').get(function(){
    return `<a href="/campgrounds/${this._id}">${this.title}</a><p>${this.description.substring(0,20)}</p>`
});

//mongoose的middleware，post后置中间件，即会在findOneAndDelete之后执行
//模型文件关注数据结构与数据库的交互逻辑，
//所以delete该campground的所有reviews应该写在这里而不是app.js中
//app.js是路由文件，关注 HTTP 请求的处理和响应
//post的第一个参数是mongoose预定义的一个hook function，不是任意函数
//hooks即Mongoose的Middleware：https://mongoosejs.com/docs/middleware.html
//findOneAndDelete是个middleware/hook，但findByIdAndDelete不是
//所以这里不能用findByIdAndDelete
CampgroundSchema.post('findOneAndDelete', async function(doc){
    //doc存储被删除的文档
    if(doc){
        await Review.deleteMany({
            _id:{
                $in: doc.reviews
            }
        })
    }
})

//Mongoose 的 middleware 和 Express 的 middleware 是两个不同概念


//mongoose.model是Mongoose提供的一个方法。用于将一个 Schema 编译成一个模型。模型是一个可以与数据库进行交互的类。
//Campground 是模型的名称。Mongoose 会根据这个名称在数据库中创建一个名为 campgrounds 的集合（注意集合名称是模型名称的小写复数形式）。
//CampgroundSchema 是一个 Mongoose Schema 对象，定义了集合中文档的结构。
//其他文件就可以通过 require 来使用这个模型进行数据库操作。
module.exports = mongoose.model('Campground', CampgroundSchema);


