module.exports = (data, socket) => {
    proxies = data

    db.prepare("UPDATE proxies SET data = ? WHERE id = 1").run(JSON.stringify(proxies))
    socket.broadcast.emit("proxiesChanged", proxies)
}