//该脚本是利用seeds目录下的cities.js和seedHelpers.js来随机生成一些campground对象，存入yelpcampdb中
//要使用该脚本, terminal中cd到该目录，node index.js
//查看是否运行成功：
//mongosh打开mongo
//use yelpcampdb切换到该项目db
//db.campgrounds.find()查看campgrounds这个collection下创建的对象 

const mongoose = require('mongoose');
const cities = require('./cities'); //import同目录下的js文件
const {descriptors, places}= require('./seedHelpers');
//axios 是一个用于发起 HTTP 请求的库，需先npm安装
//如果不用axios需自己写代码请求并接受数据
const axios = require('axios');

const Campground = require('../models/campground'); //注意这里路径需.. 返回上一级，因为现在在seeds目录中

mongoose.connect('mongodb://localhost:27017/yelpcampdb')
    .then(() => {
        console.log("MONGO CONNECTION OPEN!")
    })
    .catch(err => {
        console.log("MONGO CONNECTION ERROR!")
        console.log(err)
    })

const sample = (arr) =>{
    return arr[Math.floor(Math.random() * arr.length)];
}

//get unsplash images
//call unsplash and return small image
async function seedImg() {
    try {
    const resp = await axios.get('https://api.unsplash.com/photos/random', {
        headers: {
            Authorization: 'Client-ID Pp9HnzHrwcFLAkc0nT7vRTNpzuBtg0IS2bTqjxF_ybA'
        },
        params: {   
            collections: 10489597,
        },
    })
    return resp.data.urls.small
    } catch (err) {
    console.error(err)
    }
}

function generateRandomFilename(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let filename = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        filename += characters[randomIndex];
    }
    return filename;
}

const seedDB = async() => {
    //先清空db
    await Campground.deleteMany({});

    //随机生成
    for(let i=0; i<5; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const randomPrice = Math.floor(Math.random() * 20) + 10;
        const imageUrl = await seedImg();
        if (imageUrl) {
            console.log("Image URL:", imageUrl);   
        } else {
            console.log("Failed to fetch image.");
        }

        const filename = generateRandomFilename(20);

        const c = new Campground({
            title: `${sample(descriptors)} ${sample(places)}`,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            images: [
                {
                url: imageUrl,
                filename: 'YelpCamp/' + filename
                }
            ],
            geometry:{
                type:"Point",
                coordinates:[cities[random1000].longitude, cities[random1000].latitude]
            },
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quis facere sapiente voluptatum, vero amet nihil eligendi impedit libero fugit quibusdam quas laudantium praesentium placeat nobis et non ipsam nesciunt sint?",
            price: randomPrice,
            author: '66976b54b3ef937d079152f8',
        });
        await c.save();
    }
}

//先运行seedDB(),完了后close 数据库连接
seedDB().then(()=>{
    mongoose.connection.close();
});