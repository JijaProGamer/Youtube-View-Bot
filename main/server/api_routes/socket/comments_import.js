module.exports = (data, socket) => {
    try {
        data = JSON.parse(data.data)
    } catch (err) { return }

    let video_found = videos.filter((video) => video.id = data.video.id)[0]
    if (!video_found || !Array.isArray(data)) {
        return
    }

    for (let comment of data) {
        if(typeof comment !== "string" ) {
            break
        }

        video_found.comments.push(comment)
    }

    for (let video of videos) {
        if (video.id == data.video.id) video = video_found
    }

    db.prepare("UPDATE videos SET data = ? WHERE id = 1").run(JSON.stringify(videos))
    socket.broadcast.emit("videosChanged", videos)
}