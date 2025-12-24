export const GoogleSheetsService = {
    extractSheetId(url: string): string | null {
        const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return matches ? matches[1] : null;
    },

    async fetchSheetData(accessToken: string, sheetId: string) {
        // Fetch all data from the first sheet
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Sheet API Error:', response.status, errBody);
            throw new Error(`Failed to fetch sheet data (${response.status}: ${response.statusText})`);
        }

        const data = await response.json();
        return data.values || [];
    },

    async fetchSheetMetadata(accessToken: string, sheetId: string) {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch sheet metadata');
        return await response.json();
    },

    parseProducts(rows: any[]) {
        if (rows.length < 2) return [];

        const headers = rows[0].map((h: string) => h.toLowerCase().trim());
        const products = [];

        // Core fields
        const nameIdx = headers.findIndex((h: string) => h.includes('name') || h.includes('product') || h.includes('item'));
        const priceIdx = headers.findIndex((h: string) => h.includes('price') || h.includes('amount') || h.includes('selling'));
        const costIdx = headers.findIndex((h: string) => h.includes('cost') || h.includes('buy'));
        const stockIdx = headers.findIndex((h: string) => h.includes('stock') || h.includes('quantity') || h.includes('qty'));

        // Optional Fields
        const unitIdx = headers.findIndex((h: string) => h.includes('unit') || h.includes('measure'));
        const catIdx = headers.findIndex((h: string) => h.includes('category') || h.includes('group'));
        const statusIdx = headers.findIndex((h: string) => h.includes('status') || h.includes('active'));

        if (nameIdx === -1 || priceIdx === -1) {
            console.warn("Could not identify Name or Price columns");
            return [];
        }

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const nameVal = row[nameIdx];
            if (!nameVal) continue;

            const priceNum = parseFloat(row[priceIdx]?.replace(/[^0-9.-]+/g, '') || '0') || 0;
            const costNum = costIdx > -1 ? parseFloat(row[costIdx]?.replace(/[^0-9.-]+/g, '') || '0') || 0 : 0;
            const stockNum = stockIdx > -1 ? parseInt(row[stockIdx]?.replace(/[^0-9-]+/g, '') || '0') || 0 : 0;

            // Optional Fields
            const unitVal = unitIdx > -1 ? String(row[unitIdx]).trim() : undefined;
            const catVal = catIdx > -1 ? String(row[catIdx]).trim() : undefined;
            const statusVal = statusIdx > -1 ? String(row[statusIdx]).trim().toLowerCase() : 'active';
            const isActive = statusVal !== 'inactive' && statusVal !== 'false' && statusVal !== '0';

            products.push({
                name: String(nameVal).trim(), // Force string
                sellingPrice: priceNum, // Map to correct field for App (price -> sellingPrice)
                costPrice: costNum,
                stockQuantity: stockNum,
                unit: unitVal,
                category: catVal,
                isActive: isActive // Use sheet status if available
            });
        }

        return products;
    }
};
