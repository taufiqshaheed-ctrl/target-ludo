import mongoose from 'mongoose';

const battleSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    entryFee: { type: Number, required: true, min: 1 },
    prize: { type: Number, required: true },
    status: {
        type: String,
        enum: ['open', 'running', 'result_pending', 'completed', 'cancelled'],
        default: 'open',
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Ludo King room code entered by creator
    roomCode: { type: String, default: '' },

    // Each player's self-reported result
    creatorResult:  { type: String, enum: ['pending', 'won', 'lost', 'cancelled'], default: 'pending' },
    player2Result:  { type: String, enum: ['pending', 'won', 'lost', 'cancelled'], default: 'pending' },

    // Screenshot paths (stored on server)
    creatorScreenshot:  { type: String, default: '' },
    player2Screenshot:  { type: String, default: '' },

    // Admin note when declaring winner / voiding
    adminNote: { type: String, default: '' },

    // True once prize money has been sent to winner's wallet (prevents double-credit)
    prizeCredited: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Battle', battleSchema);
