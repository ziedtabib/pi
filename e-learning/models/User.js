const mongoose = require("mongoose");
const { Schema } = mongoose;


const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true, 
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true, 
    lowercase: true, 
    trim: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiration: {
    type: Date,
  },
  googleId: {
    type: String,
    sparse: true, 
  },
  facebookId: {
    type: String,
    sparse: true,
  },
  githubId: {
    type: String,
    sparse: true,
  },
  facialId: {
    type: String,
    unique: true,
    sparse: true,
  },
  level: {
    type: Number,
    default: 0, 
  },
  completedModules: [
    {
      moduleId: {
        type: Schema.Types.ObjectId,
        ref: "Module",
      },
      moduleName: {
        type: String,
      },
    },
  ],
  verified: {
    type: Boolean,
    default: false, 
  },
  creationDate: {
    type: Date,
    default: Date.now, 
  },
});


module.exports = mongoose.model("User", userSchema); 