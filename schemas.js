//joi的schema

const baseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        //转义HTML，防止cross site scripting
        escapeHTML: { 
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [], //空表示nothing is allowed
                    allowedAttributes: {}, //空表示nothing is allowed
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = baseJoi.extend(extension);

//使用joi进行验证
//这里的campgroundSchema是Joi的schema，和mongo无关
module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().min(0).required(),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML()
    }).required(), //整个campground object是required  
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        body: Joi.string().required().escapeHTML(),
        rating: Joi.number().required().min(1).max(5),
    }).required()
});