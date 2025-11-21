const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  
  // --- NEW SCHEMA FOR STORING AVATAR IN DB ---
  avatar: {
    data: Buffer, // This will store the image's binary data
    contentType: String, // This will store the MIME type (e.g., 'image/jpeg')
  },

  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarkedTorrents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Torrent'
  }],
  role: {
    type: String,
    enum: ['user', 'moderator'],
    default: 'user',
  }
  
}, {
  timestamps: true,
});

// Middleware to hash password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;