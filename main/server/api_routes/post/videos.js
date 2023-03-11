module.exports = (req, res) => {
    videos = req.body

    db.prepare("UPDATE videos SET data = ? WHERE id = 1").run(JSON.stringify(videos))

    io.emit("videosChanged", videos)

    res.sendStatus(201)
}