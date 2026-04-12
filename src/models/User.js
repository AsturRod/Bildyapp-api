import mongoose from "mongoose";
import { email, lowercase } from "zod";

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

const userSchema = new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true,
        },
        password:{
            type:String,
            required:true,
        },
        name:{
            type:String,
            trim:true,
            default:null,
        },
        lastName:{
            type:String,
            trim:true,
            default:null,
        },
        nif:{
            type:String,
            trim:true,
            default:null,
        },
        role:{
            type:String,
            enum:['admin', 'guest'],
            default:'admin',
            index:true,
        },
        status:{
            type:String,
            enum:['pending', 'verified'],
            default:'pending',
            index:true,
        },
        verifationCode:{
            type:String,
            default:null,
        },
        verificationAttempts:{
            type:Number,
            default:3,
        },
        company:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            default:null,
            index:true,
        },
        adress:{
            type:adressSchema,
            default:{},
        },
        deleted:{
            type:Boolean,
            default:false,
        },
    },
    {
        timestamps:true,
        toJSON:{ virtuals:true },
        toObject:{ virtuals:true },
    }
);

userSchema.virtual("fullName").get(function(){
    return `${this.name || ''} ${this.lastName || ''}`.trim();
});

const User = mongoose.model("User", userSchema);

export default User;
