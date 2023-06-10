const ytdl = require('ytdl-core');

let cache = {}
let blacklist = []

let db_insert_video = db.prepare(`INSERT INTO video_cache (data, id) VALUES (?, ?)`)
let db_get_video = db.prepare(`SELECT data FROM video_cache WHERE id = ?`)

//let fs = require("fs")

function getID(url) {
    let regex = /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gm
    let found = regex.exec(url)

    if (found && found.length > 1 && found[3]) {
        return found[3]
    } else {
        if (url.length >= 11 && url.length <= 12) {
            return url
        }
    }

    return
}

module.exports = (req, res) => {
    let id = getID(req.query.id)
    if(typeof(id) !== 'string' || id.trim().length < 11) return res.sendStatus(404)

    if (cache[id]) return res.send(cache[id])
    if (blacklist.includes(id)) return res.sendStatus(404)

    let videoFromDB = db_get_video.get(id)
    if(videoFromDB){
        res.json(JSON.parse(videoFromDB.data))
    } else if (videoFromDB == "false"){
        res.sendStatus(404)
    } else {
        ytdl.getBasicInfo(id).then((videoInfo) => {
            let vFormats = videoInfo.formats.filter((v) => v.width && v.height)
            let vFormat = vFormats.sort((a, b) => a.width - b.width).shift()
            let max_vFormat = vFormats.sort((a, b) => a.width - b.width).pop()
    
            let thumbnails = videoInfo.videoDetails.thumbnails
            let isShort = (vFormat.width / vFormat.height) < 1
            let isLive = videoInfo.videoDetails.isLiveContent && videoInfo.videoDetails.liveBroadcastDetails.isLiveNow
    
            let result = {
                title: videoInfo.videoDetails.title,
                thumbnail: thumbnails[thumbnails.length - 1].url,
                videoType: (isShort && "short") || (isLive && "livestream") || "normal",
                uploadDate: new Date(videoInfo.videoDetails.uploadDate),
                duration: parseFloat(videoInfo.videoDetails.lengthSeconds),
    
                validFilters: {
                    is4K: max_vFormat.height >= 1440,
                    isHD: max_vFormat.height >= 1080,
                    //is3D: videoInfo.formats.some(format => format.videoDetails && format.videoDetails.projectionType && format.videoDetails.projectionType !== "RECTANGULAR"),
                    isHDR: max_vFormat.colorInfo && max_vFormat.colorInfo.primaries == "COLOR_PRIMARIES_BT709",
                }
            }
    
            db_insert_video.run(JSON.stringify(result), id)
        
            res.json(result)
            cache[id] = result
        }).catch((err) => {
            //console.log(err)
            db_insert_video.run("false", id)
            blacklist.push(id)

            res.sendStatus(404)
        })
    }
}