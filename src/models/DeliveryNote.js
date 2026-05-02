import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    hours: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const materialItemSchema = new mongoose.Schema(
  {
    material: { type: String, trim: true, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ['material', 'hours'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    workDate: {
      type: Date,
      required: true,
      index: true,
    },

    material: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
    },

    hours: {
      type: Number,
      min: 0,
    },
    workers: {
      type: [workerSchema],
      default: [],
    },

    materials: {
      type: [materialItemSchema],
      default: [],
    },

    signed: {
      type: Boolean,
      default: false,
      index: true,
    },
    signedAt: {
      type: Date,
      default: null,
    },
    signatureUrl: {
      type: String,
      trim: true,
      default: null,
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: null,
    },

    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

deliveryNoteSchema.pre('validate', function () {
  if (this.format === 'material') {
    const hasSimpleMaterial =
      this.material && this.material.trim() && this.quantity != null && this.unit && this.unit.trim();

    const hasMaterialsArray = Array.isArray(this.materials) && this.materials.length > 0;

    if (!hasSimpleMaterial && !hasMaterialsArray) {
      this.invalidate(
        'materials',
        'Debes indicar material, quantity y unit o una lista de materials para albaranes de tipo material'
      );
    }

    this.hours = undefined;
    this.workers = [];
  }

  if (this.format === 'hours') {
    const hasSimpleHours = this.hours != null;
    const hasWorkersArray = Array.isArray(this.workers) && this.workers.length > 0;

    if (!hasSimpleHours && !hasWorkersArray) {
      this.invalidate(
        'workers',
        'Debes indicar hours o una lista de workers para albaranes de tipo hours'
      );
    }

    this.material = undefined;
    this.quantity = undefined;
    this.unit = undefined;
    this.materials = [];
  }
});

deliveryNoteSchema.pre(/^find/, function () {
  if (this.getOptions().includeDeleted) {
    return;
  }

  this.where({ deleted: { $ne: true } });
});

export default mongoose.models.DeliveryNote ||
  mongoose.model('DeliveryNote', deliveryNoteSchema);