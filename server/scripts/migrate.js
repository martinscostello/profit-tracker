import admin from 'firebase-admin';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Models
import { User } from '../models/User.js';
import { Business } from '../models/Business.js';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { Expense } from '../models/Expense.js';

dotenv.config({ path: '../.env' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');

// Helper to transform Firestore results (Timestamps to Dates)
const transformFirestoreData = (data) => {
    if (!data || typeof data !== 'object') return data;

    const transformed = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
            transformed[key] = value.toDate();
        } else if (value && typeof value === 'object') {
            transformed[key] = transformFirestoreData(value);
        } else {
            transformed[key] = value;
        }
    }

    return transformed;
};

let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (err) {
    console.error('❌ Error: serviceAccountKey.json not found in server/scripts/');
    console.error('Please download it from Firebase Console and place it there.');
    process.exit(1);
}

// OS specific fix for potential credential issues
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/profit-tracking';

async function migrate() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Migrate Users
        console.log('👥 Migrating Users...');
        const usersSnap = await db.collection('users').get();
        console.log(`Found ${usersSnap.size} users in Firestore`);

        for (const userDoc of usersSnap.docs) {
            const data = userDoc.data();
            const userId = userDoc.id;

            if (!data.email) {
                console.log(`   ⚠️ Skipping user ${userId}: No email address found (likely anonymous)`);
                continue;
            }

            // Check if user exists in Mongo
            let mongoUser = await User.findOne({ email: data.email });
            if (!mongoUser) {
                mongoUser = new User({
                    _id: new mongoose.Types.ObjectId(), // We'll keep their email as anchor, but new ID
                    email: data.email,
                    displayName: data.displayName || 'User',
                    password: 'MIGRATED_USER_CHANGE_ME', // User will need to reset password or use Google Login
                });
                await mongoUser.save();
                console.log(`   ✅ Created User: ${data.email}`);
            } else {
                console.log(`   ℹ️ User already exists: ${data.email}`);
            }
        }

        // 2. Migrate Businesses
        console.log('🏢 Migrating Businesses...');
        const businessesSnap = await db.collection('businesses').get();
        console.log(`Found ${businessesSnap.size} businesses in Firestore`);

        for (const bizDoc of businessesSnap.docs) {
            const bizData = transformFirestoreData(bizDoc.data());
            const bizId = bizDoc.id;

            if (!bizData.ownerId) {
                console.log(`   ⚠️ Business ${bizId} ("${bizData.name}") is missing ownerId. Data:`, bizData);
                // Try to fallback to userId if it exists
                if (bizData.userId) {
                    bizData.ownerId = bizData.userId;
                    console.log(`   ℹ️ Using userId as ownerId for business ${bizId}`);
                } else {
                    console.log(`   ❌ Skipping business ${bizId} due to missing ownerId`);
                    continue;
                }
            }

            // Check if business exists in Mongo
            let mongoBiz = await Business.findOne({ id: bizId });
            if (!mongoBiz) {
                const newBiz = new Business({
                    ...bizData,
                    id: bizId
                });
                await newBiz.save();
                console.log(`   ✅ Migrated Business: ${bizData.name} (${bizId})`);
            } else {
                console.log(`   ℹ️ Business already exists: ${bizData.name}`);
            }

            // 3. Migrate Products
            const productsSnap = await db.collection('businesses').doc(bizId).collection('products').get();
            if (productsSnap.size > 0) {
                console.log(`      📦 Migrating ${productsSnap.size} products...`);
                for (const pDoc of productsSnap.docs) {
                    const pData = transformFirestoreData(pDoc.data());
                    const pId = pDoc.id;

                    const existingProduct = await Product.findOne({ id: pId, businessId: bizId });
                    if (!existingProduct) {
                        const newProduct = new Product({
                            ...pData,
                            id: pId,
                            businessId: bizId
                        });
                        await newProduct.save();
                    }
                }
            }

            // 4. Migrate Sales
            const salesSnap = await db.collection('businesses').doc(bizId).collection('sales').get();
            if (salesSnap.size > 0) {
                console.log(`      💰 Migrating ${salesSnap.size} sales...`);
                for (const sDoc of salesSnap.docs) {
                    const sData = transformFirestoreData(sDoc.data());
                    const sId = sDoc.id;

                    const existingSale = await Sale.findOne({ id: sId, businessId: bizId });
                    if (!existingSale) {
                        const newSale = new Sale({
                            ...sData,
                            id: sId,
                            businessId: bizId
                        });
                        await newSale.save();
                    }
                }
            }

            // 5. Migrate Expenses
            const expensesSnap = await db.collection('businesses').doc(bizId).collection('expenses').get();
            if (expensesSnap.size > 0) {
                console.log(`      💸 Migrating ${expensesSnap.size} expenses...`);
                for (const eDoc of expensesSnap.docs) {
                    const eData = transformFirestoreData(eDoc.data());
                    const eId = eDoc.id;

                    const existingExpense = await Expense.findOne({ id: eId, businessId: bizId });
                    if (!existingExpense) {
                        const newExpense = new Expense({
                            ...eData,
                            id: eId,
                            businessId: bizId
                        });
                        await newExpense.save();
                    }
                }
            }
        }

        console.log('\n✨ Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
