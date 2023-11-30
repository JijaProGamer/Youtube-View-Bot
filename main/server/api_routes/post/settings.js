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
    
            if(data.id >= 0 && data.subscription >= 10){
                isPremium = true
            }
        } catch (err){
            console.error(err)
        }
    }

    global.premium = isPremium;
}

setTimeout(updatePremiumRank, 1000 * 60 * 15)
updatePremiumRank()

let lastKey = settings.api_key

module.exports = async (req, res) => {
    settings = req.body
    settings.api_key = settings.api_key.trim()

    if(lastKey !== settings.api_key){
        lastKey = settings.api_key
        updatePremiumRank()
    }

    if(settings.concurrency > 3 && !global.premium){
        await MessageUser({
            title: "This feature requires you to be a patreon subscriber",
            text: `To be able to have more than 3 concurrect workers,
            you must be a subscriber on our <a style="color: #3498db; text-decoration: none; cursor: pointer; background-color: none; font-size: 1em;" href="">Patreon</a>.
            After doing so, follow the "Full feature access" instructions in the settings tab.`,

            button1text: "OK",

            secondButton: false,
        })

        settings.concurrency = 3;
    }
    
    db.prepare('UPDATE options SET data = ? WHERE id = 1').run(JSON.stringify(settings))
    res.sendStatus(201)

    io.emit("settings", settings)
}