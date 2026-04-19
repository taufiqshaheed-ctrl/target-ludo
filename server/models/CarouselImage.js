import mongoose from 'mongoose';

const carouselImageSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CarouselImage', carouselImageSchema);
