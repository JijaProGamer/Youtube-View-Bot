module.exports = (req, res) => {
    settings = req.body

    db.prepare('UPDATE options SET data = ? WHERE id = 1').run(JSON.stringify(settings))
    res.sendStatus(201)

    io.emit("settings", settings)
}