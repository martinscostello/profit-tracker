import express from 'express';
import { Business } from '../models/Business.js';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { Expense } from '../models/Expense.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get My Businesses
router.get('/', auth, async (req, res) => {
    try {
        const businesses = await Business.find({
            $or: [
                { ownerId: req.user._id.toString() },
                { 'collaborators.userId': req.user._id.toString() }
            ]
        });
        res.send(businesses);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Create Business
router.post('/', auth, async (req, res) => {
    try {
        const business = new Business({
            ...req.body,
            ownerId: req.user._id.toString(),
            collaborators: [{
                userId: req.user._id.toString(),
                name: req.user.displayName || 'Owner',
                role: 'OWNER',
                status: 'ACTIVE'
            }]
        });
        await business.save();
        // Backend limit check omitted for now to defer to frontend "Pro" logic 
        // and avoid blocking valid Pro users until User-level plan is implemented.
    } catch (error) {
        res.status(400).send(error);
    }
});

// Update Business
router.patch('/:id', auth, async (req, res) => {
    try {
        const business = await Business.findOneAndUpdate(
            { id: req.params.id, ownerId: req.user._id.toString() },
            req.body,
            { new: true }
        );
        if (!business) return res.status(404).send();

        // Notify others
        req.app.get('io').to(business.id).emit('business_updated', business);

        res.send(business);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete Business
router.delete('/:id', auth, async (req, res) => {
    try {
        const business = await Business.findOneAndDelete({
            id: req.params.id,
            ownerId: req.user._id.toString()
        });


        if (!business) return res.status(404).send({ message: "Business not found or unauthorized" });

        // CASCADE DELETE: Remove all associated data
        await Product.deleteMany({ businessId: business.id });
        await Sale.deleteMany({ businessId: business.id });
        await Expense.deleteMany({ businessId: business.id });

        // Notify clients to remove it locally
        req.app.get('io').to(business.id).emit('business_deleted', business.id);

        res.send(business);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Helper to determine max managers (excluding owner) based on plan
const getMaxManagers = (plan) => {
    switch (plan) {
        case 'LITE': return 1;
        case 'ENTREPRENEUR': return 5;
        case 'UNLIMITED': return 9999;
        case 'FREE':
        default: return 0;
    }
};

// Generate/Get Invitation Code
router.post('/:id/invite', auth, async (req, res) => {
    try {
        const business = await Business.findOne({ id: req.params.id, ownerId: req.user._id.toString() });
        if (!business) return res.status(404).send({ message: 'Business not found or unauthorized' });

        // Enforce Plan Limit
        const managerCount = business.collaborators.filter(c => c.role !== 'OWNER').length;
        const limit = getMaxManagers(business.plan);

        if (managerCount >= limit) {
            return res.status(403).send({ message: `Upgrade required. Your plan allows ${limit} managers.` });
        }

        // Simple 6-digit code for demo
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        business.inviteCode = code;
        business.inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        await business.save();

        res.send({ code });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Join Business via Code
router.post('/join', auth, async (req, res) => {
    try {
        const { code } = req.body;
        const business = await Business.findOne({
            inviteCode: code,
            inviteExpiry: { $gt: new Date() }
        });

        if (!business) return res.status(400).send({ message: 'Invalid or expired code' });

        // Check if already a collaborator
        const exists = business.collaborators.find(c => c.userId === req.user._id.toString());
        if (exists) return res.send({ business });

        // Enforce Plan Limit (Race condition possible but low risk)
        const managerCount = business.collaborators.filter(c => c.role !== 'OWNER').length;
        const limit = getMaxManagers(business.plan);

        if (managerCount >= limit) {
            return res.status(403).send({ message: 'This business has reached its manager limit.' });
        }

        business.collaborators.push({
            userId: req.user._id.toString(),
            name: req.user.displayName || 'Contributor',
            role: 'AUDITOR', // Default role
            status: 'ACTIVE'
        });

        await business.save();

        req.app.get('io').to(business.id).emit('business_updated', business);

        res.send({ business });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update Collaborator Role/Permissions
router.patch('/:id/collaborators/:userId', auth, async (req, res) => {
    try {
        const business = await Business.findOne({ id: req.params.id, ownerId: req.user._id.toString() });
        if (!business) return res.status(404).send();

        const collaborator = business.collaborators.find(c => c.userId === req.params.userId);
        if (!collaborator) return res.status(404).send();

        Object.assign(collaborator, req.body);
        await business.save();

        req.app.get('io').to(business.id).emit('business_updated', business);
        res.send(business);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Remove Collaborator / Leave Business
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const business = await Business.findOne({ id: req.params.id });
        if (!business) return res.status(404).send();

        // If owner is leaving, maybe delete or transfer? For now, prevent or just remove from list if shared.
        // Actually, let's just remove the user from collaborators.
        business.collaborators = business.collaborators.filter(c => c.userId !== req.user._id.toString());

        // If owner leaves and no collaborators, delete?
        if (business.ownerId === req.user._id.toString() && business.collaborators.length === 0) {
            await Business.deleteOne({ _id: business._id });
            return res.send({ message: 'Business deleted' });
        }

        await business.save();
        req.app.get('io').to(business.id).emit('business_updated', business);
        res.send({ message: 'Left business' });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Remove Specific Collaborator (Admin action)
router.delete('/:id/collaborators/:userId', auth, async (req, res) => {
    try {
        const business = await Business.findOne({ id: req.params.id, ownerId: req.user._id.toString() });
        if (!business) return res.status(404).send();

        business.collaborators = business.collaborators.filter(c => c.userId !== req.params.userId);
        await business.save();

        req.app.get('io').to(business.id).emit('business_updated', business);
        res.send(business);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
