const express = require('express')
const app = express()
var cors = require('cors')

const credentials = require('./security')

const db = require('nano')(`http://${credentials.dbUsername}:${credentials.dbPassword}@localhost:5984/mob`)

app.use(cors())
app.use(express.json())

async function updateMob(mobId, mobData) {
    let doc = {};
    try {
        console.log('attempting to update mob: ' + mobId);
        // retrieve mob to get _rev
        doc = await db.get(mobId);
        // insert using _rev we just retrieaved (to update the existing doc)
        await db.insert({
            ...mobData,
            "_rev": doc._rev
        }, mobId);
    } catch (err) {
        if(err.statusCode == 404) {
            console.log('mob not found, inserting mob');
            await db.insert(mobData, mobId);
            return;
        }
    }
}

// check for updates
app.get('/mob/:id', async function (req, res) {
    try {
        const doc = await db.get(req.params.id);
        res.json(doc);
    } catch (err) {
        if(err.statusCode == 404) {
            return res.json({});
        }
        return res.json({ 'msg': 'unexpected error!'});
    }
})

// store updates
app.put('/mob/:id', function (req, res) {
    console.log('got update req');
    console.log(req.body);
    updateMob(req.params.id, req.body);
    res.json({ msg: 'Storing updates for mob: ' + req.params.id})
})

app.listen(3000)


// https://guide.couchdb.org/draft/tour.html