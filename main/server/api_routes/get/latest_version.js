const axios = require("axios").default;
let current_version;
let last_changed = Date.now();

module.exports = (req, res) => {
    if(!current_version || ((Date.now() - last_changed) / 1000 > 21600)){ // seconds in 6 hours
        axios.get("https://raw.githubusercontent.com/JijaProGamer/Youtube-View-Bot/dev/VERSION").then((result) => {
            current_version = result.data;
            res.send(current_version)
        }).catch((err) => {
            console.log("Error fetching latest version: " + err.toString());
            res.send("ERROR");
        })
    } else {
        res.send(current_version)
    }
}