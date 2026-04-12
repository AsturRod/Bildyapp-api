import mongoose from "mongoose";

const adressSchema = new mongoose.Schema(
    {
        street:{
            type:String,
            trim:true,
        },
        number:{
            type:String,
            trim:true,
        },
        postal:{
            type:String,
            trim:true,
        },
        city:{
            type:String,
            trim:true,
        },
        province:{
            type:String,
            trim:true,
        },
    },
    { _id:false }
);

const companySchema = new mongoose.Schema(
    {
        owner:{ 
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name:{
            type:String,
            trim:true,
        },
        cif:{
            type:String,
            required:true,
            trim:true,
            unique:true,
        },
        adress:{
            type:adressSchema,
            default:{},
        },
        logo:{
            type:String,
            trim:true,
            default: null,
        },
        isFreelance:{
            type:Boolean,
            default:false,
        },
        deleted:{
            type:Boolean,
            default:false,
            index:true,
        },
    },
    {
        timestamps:true,
    }
);

const Company = mongoose.model("Company", companySchema);

export default Company;
