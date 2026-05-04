import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
    },
    number: {
      type: String,
      trim: true,
    },
    postal: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "El nombre de la compañía es obligatorio"],
      trim: true,
    },
    cif: {
      type: String,
      required: [true, "El CIF es obligatorio"],
      trim: true,
      unique: true,
      index: true,
    },
    address: {
      type: addressSchema,
      default: {},
    },
    logo: {
      type: String,
      trim: true,
      default: null,
    },
    isFreelance: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


companySchema.pre(/^find/, function () {
  this.where({ deleted: { $ne: true } });
});

const Company = mongoose.models.Company || mongoose.model("Company", companySchema);

export default Company;
