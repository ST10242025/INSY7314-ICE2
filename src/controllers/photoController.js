import Photo from '../models/Photo.js';
import User from '../models/User.js';
import cloudinary from '../utils/cloudinary.js';
import stream from 'stream';

const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'securephoto' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    bufferStream.pipe(uploadStream);
  });
};

const createPhoto = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !req.file) {
      return res.status(400).json({ error: 'Title and image file are required' });
    }

    // Upload to Cloudinary
    const result = await streamUpload(req.file.buffer);

    // Save photo to DB
    const photo = new Photo({
      title,
      description,
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
      owner: req.user.id,
    });
    await photo.save();
    res.status(201).json({ photo });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

const getPhotos = async (req, res) => {
  try {
    // Always return only the user's own photos, even for admin
    const photos = await Photo.find({ owner: req.user.id }).populate('owner', 'username email');
    res.json({ photos });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllPhotos = async (req, res) => {
  try {
    const photos = await Photo.find().populate('owner', 'username email role');
    res.json({ photos });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getPhotoById = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).populate('owner', 'username email role');
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    // Only owner or admin can view
    if (photo.owner._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ photo });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updatePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    // Only owner or admin can update
    if (photo.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { title, description } = req.body;
    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;
    // Only update image if a new file is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(photo.cloudinaryId);
      // Upload new image
      const result = await streamUpload(req.file.buffer);
      photo.imageUrl = result.secure_url;
      photo.cloudinaryId = result.public_id;
    }
    await photo.save();
    res.json({ photo });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    // Only owner or admin can delete
    if (photo.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(photo.cloudinaryId);
    await photo.deleteOne();
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

export default {
  createPhoto,
  getPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  getAllPhotos,
}; 