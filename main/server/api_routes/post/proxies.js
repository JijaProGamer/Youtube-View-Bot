module.exports = (req, res) => {
    proxies = req.body

    db.prepare("UPDATE proxies SET data = ? WHERE id = 1").run(JSON.stringify(proxies))

    io.emit("proxiesChanged", proxies)
    res.sendStatus(201)
}