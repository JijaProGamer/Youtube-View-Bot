let Papa = require("papaparse")

module.exports = (req, res) => {
    res.set("Content-Type", "text/csv")
    res.set("Content-Disposition", "attachment; filename=accounts.cvs")

    let video = videos.filter((video) => video.id = req.query.video)[0]
    if (!video) {
        return res.send("")
    }

    if (req.query.type == "accounts") {
        let cvs_data = Papa.unparse(video.accounts)

        return res.send(cvs_data)
    } else if (req.query.type == "comments") {
        return res.json(video.accounts)
    }

    res.send("")
}