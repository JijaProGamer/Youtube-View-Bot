module.exports = (req, res) => {
    workingStatus = req.body.status

    io.emit("workerStatusChanged", workingStatus)
    res.sendStatus(201)

    startWorking()
}