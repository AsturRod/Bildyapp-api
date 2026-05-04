import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    number: { type: String, trim: true },
    postal: { type: String, trim: true },
    city: { type: String, trim: true },
    province: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email requerido'],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password requerido'],
      minlength: 8,
      select: false, 
    },
    name: { type: String, trim: true, default: null },
    lastName: { type: String, trim: true, default: null },
    nif: { type: String, trim: true, default: null },
    role: {
      type: String,
      enum: ['admin', 'guest'],
      default: 'admin',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
      index: true,
    },
    verificationCode: {
      type: String,
      default: null,
      select: false,
    },
    verificationCodeSentAt: {
      type: Date,
      default: null,
      select: false,
    },
    verificationAttempts: {
      type: Number,
      default: 3,
      select: false,
    },
    verificationResendWindowStart: {
      type: Date,
      default: null,
      select: false,
    },
    verificationResendCount: {
      type: Number,
      default: 0,
      select: false,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
      index: true,
    },
    address: {
      type: addressSchema,
      default: {},
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("fullName").get(function () {
  return `${this.name || ""} ${this.lastName || ""}`.trim();
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ company: 1, status: 1, role: 1 });
userSchema.index({ company: 1, deleted: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre(/^find/, function () {
  this.where({ deleted: { $ne: true } });
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
