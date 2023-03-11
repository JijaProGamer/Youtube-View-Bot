module.exports = (data, socket) => {
    videos = data

    db.prepare("UPDATE videos SET data = ? WHERE id = 1").run(JSON.stringify(videos))
    socket.broadcast.emit("videosChanged", videos)
}