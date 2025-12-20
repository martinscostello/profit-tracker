import express from 'express';
import { Product } from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get Products for a business
router.get('/:businessId', auth, async (req, res) => {
    try {
        const products = await Product.find({ businessId: req.params.businessId });
        res.send(products);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Add Product
router.post('/', auth, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();

        // Notify others
        req.app.get('io').to(product.businessId).emit('product_added', product);

        res.status(201).send(product);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Update Product
router.patch('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (!product) return res.status(404).send();

        req.app.get('io').to(product.businessId).emit('product_updated', product);

        res.send(product);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete Product
router.delete('/:businessId/:id', auth, async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ id: req.params.id, businessId: req.params.businessId });
        if (!product) return res.status(404).send();

        req.app.get('io').to(req.params.businessId).emit('product_deleted', req.params.id);

        res.send(product);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
