const mongoose = require('mongoose'); 
//要使用passport-local-mongoose，除了安装passport-local-mongoose，必须安装passport-local
//而要使用passport-local，必须安装passport
//使用passport-local-mongoose 看doc即可
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email:{
        type: String,
        required: true,
        unique: true
    }
    //schema中不需要显式定义 username 和 password 字段
    //passport-local-mongoose 插件会自动添加这些字段，并处理密码哈希和验证等操作。
    //创建User对象时可正常地给 username，password赋值
});

//plugin: 将 passport-local-mongoose 插件添加到 Mongoose 模式 (Schema) 中
//assport-local-mongoose 插件: 
//自动添加用户名和密码字段到模式中，并提供预定义的方法来处理注册、登录、密码验证等操作。
//自动处理密码哈希和验证，使用 bcrypt 来加密密码，保证密码的安全性。
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);