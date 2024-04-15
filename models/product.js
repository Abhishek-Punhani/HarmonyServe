const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const productSchema=new Schema({
    image:{
        url:String,
        filename:String,
    },
    title:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    review:[{
        type:Schema.Types.ObjectId,
        ref:"Review"}],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    orders:[
        {
            type:Schema.Types.ObjectId,
            ref:"Product",
        }
    ]
});
const Product=mongoose.model("Product",productSchema);
module.exports=Product;