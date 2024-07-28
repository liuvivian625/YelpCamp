const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//先config cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary, //前面config好的cloudinary对象
    params: {
      folder: 'YelpCamp', //cloudinary中的目录名
      allowedFormates: ['jpeg', 'png', 'jpg'], // supports promises as well
      //public_id: (req, file) => 'computed-filename-using-request'
    },
  });

module.exports = {
    cloudinary,
    storage
}