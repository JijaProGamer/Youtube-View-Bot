const { v4 } = require("uuid")

process.stdin.setMaxListeners(0)

function askData() {
    return new Promise(async (resolve, reject) => {
        let id = v4().split("-").join("")

        let [data] = await Promise.all([
            new Promise(r => process.stdin.on("data", (res) => {
                res = res.toString()

                let idFound = res.split("-+++-")
                if (idFound[1] && idFound[1] == id) {
                    r(idFound[0])
                }
            })),
            sendData("::question::", id, ...Array.from(arguments)),
        ])

        data = data.split("--data=")[1]
        let [dataType, message] = data.split("-:::-")

        switch (dataType) {
            case "object":
                message = JSON.parse(message)
                break
            case "undefined":
                message = undefined
                break
            case "number":
                message = parseFloat(message)
                break
        }

        resolve(message)
    })
}

function sendData() {
    return new Promise((resolve, reject) => {
        let newArgs = Array.from(arguments)

        let questionId
        let isQuestion = false

        if (newArgs[0] && newArgs[0] == "::question::") {
            isQuestion = newArgs.shift()
            questionId = newArgs.shift()
        }

        for (let arg of newArgs) {
            let data
            let dataType = typeof arg

            switch (dataType) {
                case "object":
                    data = JSON.stringify(arg)
                    break
                default:
                    data = arg && arg.toString()
            }

            if (isQuestion) {
                process.stdout.write(`--data=${dataType}-:q:-${data}-++-${questionId}\n`, resolve)
            } else {
                process.stdout.write(`--data=${dataType}-:::-${data}\n`, resolve)
            }
        }
    })
}

const path = require("path");
let youtube_selfbot_api = require("youtube-selfbot-api");

let bandwith = 0

let args = process.argv.slice(2, process.argv.length)
let { proxy, account, id, watch_type, watch_time, watch_entire_livestream, video_info } = JSON.parse(args[0])
let { auto_skip_ads, chromePath, no_visuals, headless, proxyTimeout } = JSON.parse(args[1])
let userDataDir = args[2];

let browser

process.on("SIGINT", async () => {
    if(browser){
        await browser.close()
    }

    process.exit(0)
});

(async () => {
    let bot = new youtube_selfbot_api(chromePath, {
        headless: headless,
        userDataDir: path.join(__dirname, `/cache/${userDataDir}`),
        proxy,
        no_visuals,
        autoSkipAds: auto_skip_ads,
        timeout: proxyTimeout * 1000,
        cacheDB: {
            save: (url, data) => {
                return new Promise((resolve, reject) => {
                    sendData({
                        type: "setDatabase",
                        message: {
                            url,
                            data,
                        }
                    }).then(resolve)
                })
            },
            get: (url) => {
                return new Promise((resolve, reject) => {
                    askData({
                        type: "getDatabase",
                        message: url,
                    }).then((result) => {
                        resolve(result)
                    })
                })
            }
        }
    })

    browser = await bot.launch()

    browser.on("bandwith", (id, type, len) => {
        if (type !== "document") {
            bandwith += len

            sendData({
                type: "bandwith_increase",
                message: parseFloat((bandwith / 1e+6).toPrecision(2))
            })
        }
    })

    /*browser.on("loginCode", (id, code) => {
        browser.emit("handlingCode", true)
    })*/

    let page = await browser.newPage()
    let googleContext

    if (account) {
        let cookies

        try {
            cookies = JSON.parse(account.cookies)
        } catch (err) { }

        browser.on("loginFailed", () => {
            sendData({
                type: "login_failed",
            })
        })

        googleContext = await page.setupGoogle(account, cookies)
        await googleContext.login(account)
    } else {
        await browser.clearStorage()
    }

    let keywordCombo = video_info.title

    let watcherContext = await page.gotoVideo(watch_type, id, {
        forceFind: true,
        title: keywordCombo,
    })

    let isLive = video_info.isLive

    if (!isLive) {
        await watcherContext.seek(0)
    }

    let start_time = await watcherContext.time()
    let start_date = Date.now()

    // $(`#movie_player`).className.split(" ")

    // 

    browser.on("videoStateChanged", (lastState, newState) => {
        if (newState == "FINISHED") {
            clearInterval(watchInterval)

            sendData({
                type: "video_finished",
            })
        }
    })

    let watchInterval = setInterval(async () => {
        let currentWatchTime = await watcherContext.time()
        let watchTimePercent = (100 / video_info.duration) * currentWatchTime

        if (!isLive) {
            await sendData({
                type: "watchtime_increase",
                message: currentWatchTime
            })
        } else {
            await sendData({
                type: "watchtime_increase",
                message: (Date.now() - start_date) / 1000
            })
        }

        if (account) {
            if (isLive) {
                if (account.like) {
                    await googleContext.like()
                }

                if (account.dislike) {
                    await googleContext.dislike()
                }

                if (account.comment) {
                    await googleContext.comment(account.comment)
                }
            } else {
                if (account) {
                    if (account.like) {
                        if (watchTimePercent >= account.likeAt) {
                            await googleContext.like()
                        }
                    }

                    if (account.dislike) {
                        if (watchTimePercent >= account.dislikeAt) {
                            await googleContext.dislike()
                        }
                    }

                    if (account.comment) {
                        if (watchTimePercent >= account.commentAt) {
                            await googleContext.comment(account.comment)
                        }
                    }
                }
            }
        }

        if (!isLive) {
            if (watchTimePercent >= watch_time) {
                sendData({
                    type: "video_finished",
                })
            }
        } else {
            if (!watch_entire_livestream) {
                if ((Date.now() - start_time) > watch_time * 1000) {
                    sendData({
                        type: "video_finished",
                    })
                }
            }
        }
    }, 500)
})()