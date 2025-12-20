import express from 'express';
import mongoose from 'mongoose';
import { Sale } from '../models/Sale.js';
import { Expense } from '../models/Expense.js';
import { Product } from '../models/Product.js';
import { auth as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get Dashboard Stats (Aggregated)
router.get('/:id/dashboard-stats', authMiddleware, async (req, res) => {
    try {
        const businessId = req.params.id;
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Today's Stats
        const todayStats = await Sale.aggregate([
            { $match: { businessId, date: { $gte: startOfToday.toISOString() } } },
            {
                $group: {
                    _id: null,
                    grossProfit: { $sum: "$profit" },
                    revenue: { $sum: "$revenue" },
                    itemsSold: { $sum: "$quantity" }
                }
            }
        ]);

        const todayExpenses = await Expense.aggregate([
            { $match: { businessId, date: { $gte: startOfToday.toISOString() } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // 2. Weekly & Monthly Revenue
        const historyStats = await Sale.aggregate([
            { $match: { businessId, date: { $gte: startOfMonth.toISOString() } } },
            {
                $facet: {
                    weekly: [
                        { $match: { date: { $gte: startOfWeek.toISOString() } } },
                        { $group: { _id: null, revenue: { $sum: "$revenue" } } }
                    ],
                    monthly: [
                        { $group: { _id: null, revenue: { $sum: "$revenue" } } }
                    ]
                }
            }
        ]);

        // 3. Inventory Alerts
        const restockCount = await Product.countDocuments({
            businessId,
            isActive: true,
            $or: [{ stockQuantity: { $lte: 0 } }, { stockQuantity: null }]
        });

        const activeCount = await Product.countDocuments({ businessId, isActive: true });

        // 4. Top Products
        const topProducts = await Sale.aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: "$productId",
                    name: { $first: "$productName" },
                    totalProfit: { $sum: "$profit" },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { totalProfit: -1 } },
            { $limit: 3 }
        ]);

        const result = {
            today: {
                grossProfit: todayStats[0]?.grossProfit || 0,
                revenue: todayStats[0]?.revenue || 0,
                itemsSold: todayStats[0]?.itemsSold || 0,
                expenses: todayExpenses[0]?.total || 0,
                netProfit: (todayStats[0]?.grossProfit || 0) - (todayExpenses[0]?.total || 0)
            },
            history: {
                weekSales: historyStats[0]?.weekly[0]?.revenue || 0,
                monthSales: historyStats[0]?.monthly[0]?.revenue || 0,
            },
            inventory: {
                active: activeCount,
                restock: restockCount
            },
            topProducts
        };

        res.send(result);
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).send(error);
    }
});

// Sales Trends (Daily for last 30 days)
router.get('/:id/sales-trend', authMiddleware, async (req, res) => {
    try {
        const businessId = req.params.id;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trend = await Sale.aggregate([
            { $match: { businessId, date: { $gte: thirtyDaysAgo.toISOString() } } },
            {
                $addFields: {
                    dateOnly: { $substr: ["$date", 0, 10] }
                }
            },
            {
                $group: {
                    _id: "$dateOnly",
                    revenue: { $sum: "$revenue" },
                    profit: { $sum: "$profit" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.send(trend);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Top Products
router.get('/:id/top-products', authMiddleware, async (req, res) => {
    try {
        const businessId = req.params.id;
        const top = await Sale.aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: "$productId",
                    name: { $first: "$productName" },
                    totalRevenue: { $sum: "$revenue" },
                    totalProfit: { $sum: "$profit" },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            { $sort: { totalProfit: -1 } },
            { $limit: 5 }
        ]);

        res.send(top);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Expense Breakdown
router.get('/:id/expense-breakdown', authMiddleware, async (req, res) => {
    try {
        const businessId = req.params.id;
        const breakdown = await Expense.aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.send(breakdown);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
