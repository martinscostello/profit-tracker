import express from 'express';
import { Sale } from '../models/Sale.js';
import { Expense } from '../models/Expense.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// --- Sales ---
router.get('/sales/:businessId', auth, async (req, res) => {
    try {
        const sales = await Sale.find({ businessId: req.params.businessId });
        res.send(sales);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/sales', auth, async (req, res) => {
    try {
        const sale = new Sale(req.body);
        await sale.save();
        req.app.get('io').to(sale.businessId).emit('sale_added', sale);
        res.status(201).send(sale);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/sales/:businessId/:id', auth, async (req, res) => {
    try {
        await Sale.findOneAndDelete({ id: req.params.id, businessId: req.params.businessId });
        req.app.get('io').to(req.params.businessId).emit('sale_deleted', req.params.id);
        res.send({ success: true });
    } catch (error) {
        res.status(500).send(error);
    }
});

// --- Expenses ---
router.get('/expenses/:businessId', auth, async (req, res) => {
    try {
        const expenses = await Expense.find({ businessId: req.params.businessId });
        res.send(expenses);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/expenses', auth, async (req, res) => {
    try {
        const expense = new Expense(req.body);
        await expense.save();
        req.app.get('io').to(expense.businessId).emit('expense_added', expense);
        res.status(201).send(expense);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/expenses/:businessId/:id', auth, async (req, res) => {
    try {
        await Expense.findOneAndDelete({ id: req.params.id, businessId: req.params.businessId });
        req.app.get('io').to(req.params.businessId).emit('expense_deleted', req.params.id);
        res.send({ success: true });
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
