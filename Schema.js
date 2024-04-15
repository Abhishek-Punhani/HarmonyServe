const joi=require('joi');

module.exports.listingSchema=joi.object({
    title:joi.string().required(),
    category:joi.string().required(),
    price:joi.number().required().min(0),
    description:joi.string().required(),
    location:joi.string().required(),
    image:joi.object({
        filename:joi.string().required(),
        url:joi.string().required(),
    }).required(),

})
module.exports.reviewSchema=joi.object(
    {
        reviews :joi.object(
            {
                rating:joi.number().required().min(1).max(5),
                comment:joi.string().required()
            }
        ).required(),
    }
);