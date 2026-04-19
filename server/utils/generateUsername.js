import User from '../models/User.js';

/**
 * Generates a unique username from a full name.
 * Strategy: slugify the name → check DB → if taken, append random digits → retry.
 */
const generateUniqueUsername = async (fullName) => {
    // Slugify: lowercase, spaces → underscore, strip anything not a-z/0-9/_
    const base = fullName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15) || 'user';

    // Try the base first, then up to 10 suffixed variants
    const candidates = [base];
    for (let i = 0; i < 10; i++) {
        const suffix = Math.floor(100 + Math.random() * 9000); // 3-4 digits
        candidates.push(`${base}_${suffix}`);
    }

    for (const candidate of candidates) {
        const exists = await User.findOne({ username: candidate }).lean();
        if (!exists) return candidate;
    }

    // Fallback: timestamp-based, guaranteed unique
    return `${base}_${Date.now().toString().slice(-6)}`;
};

export default generateUniqueUsername;
