import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
    {
        street: { type: String, required: true },
        number: { type: String, required: true },
        postal: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String, required: true },
    
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        company:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true,
        },
        client:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
            index: true,
        },
        name:{
            type: String,
            required: true,
            trim:true,
        },
        projectCode:{
            type: String,
            required: true,
            trim:true,
            uppercase: true,
        },
        address:{
            type: addressSchema,
            required: true,
        },
        email:{
            type: String,
            required: true,
            lowercase:true,
        },
        notes:{
            type: String,
            trim:true,
        },
        active:{
            type: Boolean,
            default: true,
            index:true,
        },
        deleted:{
            type: Boolean,
            default: false,
            index:true,
        }
    },
    { 
        timestamps: true,
        toJSON: {virtuals: true},
        toObject: {virtuals: true},
    }
);


projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });
projectSchema.index({ company: 1, deleted: 1, client: 1, active: 1, createdAt: -1 });

projectSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted) return next();
  this.where({ deleted: { $ne: true } });
  next();
});

export default mongoose.models.Project || mongoose.model('Project', projectSchema);