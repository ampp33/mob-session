const express = require('express')
const app = express()
var cors = require('cors')

app.use(cors())
app.use(express.json())

// check for updates
app.get('/mob/:id', function (req, res) {
    res.json({ msg: 'Checking for updates for mob: ' + req.params.id})
})

// store updates
app.put('/mob/:id', function (req, res) {
    console.log('got update req');
    console.log(req.body);
    res.json({ msg: 'Storing updates for mob: ' + req.params.id})
})

app.listen(3000)