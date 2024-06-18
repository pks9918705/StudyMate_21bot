const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  file_unique_id:{
    type: String,
    required: true
  },
  fileLink: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

module.exports = File;
