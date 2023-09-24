const axios = require("axios")

async function updatePremiumRank(){
    let isPremium = false
    let api_key = settings.api_key

    if(api_key){
        try {
            let data = (await axios.get("https://www.bloxxy.net/api/patreon", {
                headers: {
                    Cookie: `connect.sid=${api_key}`
                }
            })).data
    
            if(data.data.id >= 0 && data.data.subscription >= 10){
                isPremium = true
            }
        } catch (err){
            console.error(err)
        }
    }

    global.premium = isPremium;
}

setTimeout(updatePremiumRank, 1000 * 60 * 15)

let lastKey = settings.api_key
updatePremiumRank()

module.exports = (req, res) => {
    settings = req.body
    settings.api_key = settings.api_key.trim()

    if(lastKey !== settings.api_key){
        lastKey = settings.api_key
        updatePremiumRank()
    }
    
    db.prepare('UPDATE options SET data = ? WHERE id = 1').run(JSON.stringify(settings))
    res.sendStatus(201)

    io.emit("settings", settings)
}