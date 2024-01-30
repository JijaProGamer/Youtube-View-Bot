let Papa = require("papaparse")

module.exports = (req, res) => {
    res.set("Content-Type", "text/csv")

    let video = videos.filter((video) => video.id = req.query.video)[0]
    if (!video) {
        return res.send("")
    }

    if (req.query.type == "accounts") {
        res.set("Content-Disposition", "attachment; filename=accounts.csv")
        let csv_data = Papa.unparse(video.accounts)

        return res.send(csv_data)
    } else if (req.query.type == "comments") {
        res.set("Content-Disposition", "attachment; filename=comments.json")
        let csv_data = Papa.unparse(video.comments)

        return res.send(csv_data)
    }

    res.send("")
}