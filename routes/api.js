// Below we will use the Express Router to define a series of API endpoints.
// Express will listen for API requests and respond accordingly
import express from 'express'
const router = express.Router()

// Set this to match the model name in your Prisma schema
const model = 'cats'

// Prisma lets NodeJS communicate with MongoDB
// Let's import and initialize the Prisma client
// See also: https://www.prisma.io/docs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Import del function from Vercel Blob for image cleanup
import { del } from '@vercel/blob'

// Connect to the database
prisma.$connect().then(() => {
    console.log('Prisma connected to MongoDB')
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err)
})

// ----- CREATE (POST) -----
// Create a new record for the configured model
// This is the 'C' of CRUD
router.post('/data', async (req, res) => {
    try {
        // Remove the id field from request body if it exists
        // MongoDB will auto-generate an ID for new records
        const { id, ...createData } = req.body

        const created = await prisma[model].create({
            data: createData
        })
        res.status(201).send(created)
    } catch (err) {
        console.error('POST /data error:', err)
        res.status(500).send({ error: 'Failed to create record', details: err.message || err })
    }
})


// ----- READ (GET) list ----- 
router.get('/data', async (req, res) => {
    try {
        // fetch first 100 records from the database with no filter
        const result = await prisma[model].findMany({
            take: 100
        })
        res.send(result)
    } catch (err) {
        console.error('GET /data error:', err)
        res.status(500).send({ error: 'Failed to fetch records', details: err.message || err })
    }
})



// ----- findMany() with search ------- 
// Accepts optional search parameter to filter by name field
// See also: https://www.prisma.io/docs/orm/reference/prisma-client-reference#examples-7
router.get('/search', async (req, res) => {
    try {
        // get search terms from query string, default to empty string
        const searchTerms = req.query.terms || ''
        // fetch the records from the database
        const result = await prisma[model].findMany({
            where: {
                name: {
                    contains: searchTerms,
                    mode: 'insensitive'  // case-insensitive search
                }
            },
            orderBy: { name: 'asc' },
            take: 10
        })
        res.send(result)
    } catch (err) {
        console.error('GET /search error:', err)
        res.status(500).send({ error: 'Search failed', details: err.message || err })
    }
})


// ----- UPDATE (PUT) -----
// Listen for PUT requests
// respond by updating a particular record in the database
// This is the 'U' of CRUD
// After updating the database we send the updated record back to the frontend.


router.put('/data/:id', async (req, res) => {
    const { id, _id, ...requestBody } = req.body || {};

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const updated = await prisma[model].update({
                where: { id: req.params.id },
                data: requestBody,
            });
            console.log(`PUT /data/${req.params.id} successful on attempt ${attempt}:`, updated);

            return res.send(updated);
        } catch (err) {

            if (err.code === 'P2034') {
                if (attempt < 2) {
                    await new Promise(r => setTimeout(r, 100))
                    continue;
                }
                return res.status(409).send({ error: 'Write conflict, please retry' });
            }

            console.error('PUT /data/:id error:', err);
            return res.status(500).send({ error: 'Failed to update record' });
        }
    }
});

// ----- DELETE -----
// Listen for DELETE requests
// respond by deleting a particular record in the database
// This is the 'D' of CRUD
router.delete('/data/:id', async (req, res) => {
    try {
        // Get the cat record first to get the image URL
        const cat = await prisma[model].findUnique({
            where: { id: req.params.id }
        })

        // Delete from database
        const result = await prisma[model].delete({
            where: { id: req.params.id }
        })

        // Delete associated image from Vercel Blob (if exists)
        if (cat?.imageUrl) {
            try {
                await del(cat.imageUrl)
                console.log('Deleted image:', cat.imageUrl)
            } catch (blobError) {
                console.error('Failed to delete image:', blobError)
                // Don't fail the whole operation if image delete fails
            }
        }

        res.send(result)
    } catch (err) {
        console.error('DELETE /data/:id error:', err)
        res.status(500).send({ error: 'Failed to delete record', details: err.message || err })
    }
})


// export the api routes for use elsewhere in our app 
// (e.g. in index.js )
export default router;

