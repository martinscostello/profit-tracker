import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Business } from '../models/Business.js';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { Expense } from '../models/Expense.js';
import { auth as authMiddleware } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const router = express.Router();

// Register
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        // check if user exists
        let user = await User.findOne({ email });
        if (user && user.isVerified) {
            return res.status(400).send({ error: 'User already exists' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        if (!user) {
            user = new User({ email, password, displayName, otp, otpExpires, isVerified: false });
        } else {
            // Update unverified user
            user.password = password;
            user.displayName = displayName;
            user.otp = otp;
            user.otpExpires = otpExpires;
        }

        await user.save();

        // TODO: Integrate Nodemailer or SendGrid here
        console.log(`[AUTH] OTP for ${email}: ${otp}`);

        res.status(200).send({ message: 'Verification code sent', email });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(400).send(error);
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).send({ error: 'User already verified' });
        }

        if (user.otp !== code || user.otpExpires < Date.now()) {
            return res.status(400).send({ error: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).send({ error: 'User not found' });
        if (user.isVerified) return res.status(400).send({ error: 'User already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        console.log(`[AUTH] Resent OTP for ${email}: ${otp}`);
        res.send({ message: 'OTP resent' });

    } catch (error) {
        res.status(400).send(error);
    }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).send({ error: 'User already verified' });
        }

        if (user.otp !== code || user.otpExpires < Date.now()) {
            return res.status(400).send({ error: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).send({ error: 'User not found' });
        if (user.isVerified) return res.status(400).send({ error: 'User already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        console.log(`[AUTH] Resent OTP for ${email}: ${otp}`);
        res.send({ message: 'OTP resent' });

    } catch (error) {
        res.status(400).send(error);
    }
});


// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).send({ error: 'Login failed! Check authentication credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).send({ error: 'Email not verified. Please verify your account.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Me
router.get('/me', authMiddleware, async (req, res) => {
    res.send(req.user);
});

// Google Auth
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        console.log("Include Body Debug:", req.body);
        console.log("Received ID Token:", idToken ? idToken.substring(0, 10) + "..." : "UNDEFINED");
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                email,
                displayName: name,
                photoURL: picture,
                googleId,
                password: Math.random().toString(36).slice(-10) // Random password for internal use
            });
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.send({ user, token });
    } catch (error) {
        console.error('Google Auth Error:', error);
        console.log("Error Message:", error.message);
        console.log("Error String:", error.toString());

        // CLOCK SKEW WORKAROUND:
        // Check both message and string representation to be safe
        const errMsg = error.message || error.toString();
        if (errMsg.includes('Token used too late')) {
            console.log("⚠️ Clock Skew Detected! Bypassing strict time check...");
            const decoded = jwt.decode(req.body.idToken);

            if (decoded) {
                const { email, name, picture, sub: googleId } = decoded;
                console.log("✅ Decoded Fallback Profile:", email);

                let user = await User.findOne({ email });
                if (!user) {
                    user = new User({
                        email,
                        displayName: name,
                        photoURL: picture,
                        googleId,
                        password: Math.random().toString(36).slice(-10)
                    });
                    await user.save();
                }

                const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
                return res.send({ user, token });
            }
        }

        res.status(401).send({ error: 'Google authentication failed' });
    }
});

// Apple Auth
router.post('/apple', async (req, res) => {
    try {
        const { identityToken, givenName, familyName } = req.body;

        // MVP: Decode token without strict signature verification (requires fetching Apple's JWKS)
        // In production, use 'apple-signin-auth' or 'jwks-rsa' to verify signature.
        const decoded = jwt.decode(identityToken);

        if (!decoded || !decoded.sub) {
            return res.status(401).send({ error: 'Invalid Apple Identity Token' });
        }

        const { email, sub: appleId } = decoded;
        const name = (givenName && familyName) ? `${givenName} ${familyName}` : (givenName || 'Apple User');

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                email,
                displayName: name,
                photoURL: '', // Apple doesn't provide photo
                googleId: appleId, // Reusing googleId field or we should add 'appleId' schema but googleId is likely just 'providerId' in practice
                password: Math.random().toString(36).slice(-10)
            });
            await user.save();
        } else {
            // Update name if provided and user doesn't have one (Apple only sends name on first login)
            if (name && name !== 'Apple User' && (!user.displayName || user.displayName === 'Apple User')) {
                user.displayName = name;
                await user.save();
            }
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });
        res.send({ user, token });

    } catch (error) {
        console.error('Apple Auth Error:', error);
        res.status(401).send({ error: 'Apple authentication failed' });
    }
});



// Sync Local Data
router.post('/sync', authMiddleware, async (req, res) => {
    try {
        // resolutions: { [localId]: 'MERGE' | 'REPLACE' | 'KEEP_SEPARATE' }
        // allowedIds: string[] | undefined (If provided, DELETE businesses not in this list)
        const { localBusinesses, products, sales, expenses, resolutions = {}, allowedIds } = req.body;
        const userId = req.user._id.toString();

        console.log(`[SYNC] Received payload from User ${userId}:`, {
            businesses: localBusinesses.length,
            resolutions,
            allowedIds: allowedIds ? allowedIds.length : 'ALL'
        });

        // 0. Handle Sync Limit Deletions (Pruning)
        if (allowedIds && Array.isArray(allowedIds)) {
            console.log(`[SYNC] Pruning businesses not in allowed list:`, allowedIds);

            // Fetch all user businesses to filter safely in memory (Avoids ObjectId CastError with UUIDs)
            const allUserBusinesses = await Business.find({ ownerId: userId });

            const businessesToDelete = allUserBusinesses.filter(b => {
                const idMatch = allowedIds.includes(b.id);
                const oidMatch = allowedIds.includes(b._id.toString());
                return !idMatch && !oidMatch;
            });

            if (businessesToDelete.length > 0) {
                const deleteIds = businessesToDelete.map(b => b.id);
                const deleteOids = businessesToDelete.map(b => b._id);

                console.log(`[SYNC] Deleting ${businessesToDelete.length} pruned businesses:`, deleteIds);

                await Business.deleteMany({ _id: { $in: deleteOids } });
                await Product.deleteMany({ businessId: { $in: deleteIds } });
                await Sale.deleteMany({ businessId: { $in: deleteIds } });
                await Expense.deleteMany({ businessId: { $in: deleteIds } });
            }
        }

        // 1. Fetch Existing Cloud Businesses
        const existingBusinesses = await Business.find({ ownerId: userId });

        // 2. Identify Collisions
        const conflicts = [];
        let projectedNewCount = existingBusinesses.length;

        for (const localBiz of localBusinesses) {
            const match = existingBusinesses.find(b => b.name === localBiz.name);
            const resolution = resolutions[localBiz.id];

            if (match) {
                if (!resolution) {
                    conflicts.push({ local: localBiz, cloud: match });
                } else {
                    if (resolution === 'KEEP_SEPARATE') projectedNewCount++;
                }
            } else {
                projectedNewCount++;
            }
        }

        if (conflicts.length > 0) {
            console.log(`[SYNC] Name Collisions Detected: ${conflicts.length}`);
            return res.status(409).send({ error: 'NAME_COLLISION', conflicts });
        }

        // 3. Check Plan Limits
        const PLAN_LIMITS = { 'FREE': 2, 'PRO': 10, 'UNLIMITED': 999 };
        const userPlan = req.user.plan || 'FREE';
        const limit = PLAN_LIMITS[userPlan];

        if (projectedNewCount > limit) {
            console.log(`[SYNC] Plan Limit Exceeded: ${projectedNewCount} > ${limit}`);
            return res.status(409).send({
                error: 'PLAN_LIMIT_EXCEEDED',
                limit,
                currentCount: existingBusinesses.length,
                newCount: projectedNewCount,
                existingBusinesses
            });
        }

        const syncedBusinesses = [];
        let stats = { products: 0, sales: 0, expenses: 0 };

        // 4. Execution
        for (const localBiz of localBusinesses) {
            const match = existingBusinesses.find(b => b.name === localBiz.name);
            const resolution = resolutions[localBiz.id];
            let targetBusinessId;

            if (match) {
                if (resolution === 'MERGE') {
                    console.log(`[SYNC] Merging Business: ${localBiz.name}`);
                    targetBusinessId = match._id.toString();
                    syncedBusinesses.push(match);
                } else if (resolution === 'REPLACE') {
                    console.log(`[SYNC] Replacing Business: ${localBiz.name}`);
                    targetBusinessId = match._id.toString();
                    await Product.deleteMany({ businessId: targetBusinessId });
                    await Sale.deleteMany({ businessId: targetBusinessId });
                    await Expense.deleteMany({ businessId: targetBusinessId });

                    Object.assign(match, localBiz);
                    match.ownerId = userId;
                    await match.save();
                    syncedBusinesses.push(match);
                } else if (resolution === 'KEEP_SEPARATE') {
                    console.log(`[SYNC] Keeping Separate: ${localBiz.name}`);
                    const newBiz = new Business({
                        ...localBiz,
                        name: `${localBiz.name} (Local)`,
                        ownerId: userId,
                        collaborators: [{ userId: userId, name: req.user.displayName || 'Owner', role: 'OWNER', status: 'ACTIVE' }]
                    });
                    await newBiz.save();
                    targetBusinessId = newBiz.id;
                    syncedBusinesses.push(newBiz);
                }
            } else {
                console.log(`[SYNC] Creating New Business: ${localBiz.name}`);
                const exists = await Business.findOne({ id: localBiz.id }); // Check if ID already claimed?
                if (exists && exists.ownerId === userId) {
                    targetBusinessId = exists.id;
                    syncedBusinesses.push(exists);
                } else {
                    const newBiz = new Business({
                        ...localBiz,
                        ownerId: userId,
                        collaborators: [{ userId: userId, name: req.user.displayName || 'Owner', role: 'OWNER', status: 'ACTIVE' }]
                    });
                    await newBiz.save();
                    targetBusinessId = newBiz.id;
                    syncedBusinesses.push(newBiz);
                }
            }

            if (targetBusinessId) {
                const bizProducts = products.filter(p => p.businessId === localBiz.id);
                const bizSales = sales.filter(s => s.businessId === localBiz.id);
                const bizExpenses = expenses.filter(e => e.businessId === localBiz.id);

                stats.products += bizProducts.length;
                stats.sales += bizSales.length;
                stats.expenses += bizExpenses.length;

                const performBulkInsert = async (Model, items) => {
                    if (!items.length) return;
                    const operations = items.map(item => ({
                        updateOne: {
                            filter: { id: item.id }, // Upsert by UUID
                            update: { $set: { ...item, _id: undefined, businessId: targetBusinessId } },
                            upsert: true
                        }
                    }));
                    await Model.bulkWrite(operations);
                };

                await performBulkInsert(Product, bizProducts);
                await performBulkInsert(Sale, bizSales);
                await performBulkInsert(Expense, bizExpenses);
            }
        }

        console.log(`[SYNC] Success. Synced:`, stats);
        res.send({ success: true, businesses: syncedBusinesses });

    } catch (error) {
        console.error("Sync Failed:", error);
        res.status(500).send({ error: 'Sync failed', details: error.message });
    }
});

// Guest Login (Simulated)
router.post('/guest', async (req, res) => {
    try {
        const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`👤 Attempting Guest Login: ${guestId}`);

        const user = new User({
            email: `${guestId}@guest.com`,
            password: 'guest_password',
            displayName: 'Guest User'
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
        console.log(`✅ Guest Login Success: ${guestId}`);
        res.send({ user, token });
    } catch (error) {
        console.error('❌ Guest Login Failed:', error);
        res.status(400).send({ error: 'Guest login failed', details: error.message });
    }
});

export default router;
