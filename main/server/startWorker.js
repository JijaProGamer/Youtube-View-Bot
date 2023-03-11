//import { spawn } from "child_process"
import { default as youtube_selfbot_api } from "youtube-selfbot-api"
import { to } from "await-to-js"
import * as path from "path"
import { v4 } from "uuid"

let db_insert_watch_time = db.prepare(`INSERT OR IGNORE INTO watch_time (date, value) VALUES (?, ?)`)
let db_update_watch_time = db.prepare(`UPDATE watch_time SET value = value + ? WHERE date = ?`)

let db_insert_bandwidth = db.prepare(`INSERT OR IGNORE INTO bandwidth (date, value) VALUES (?, ?)`)
let db_update_bandwidth = db.prepare(`UPDATE bandwidth SET value = value + ? WHERE date = ?`)

let db_insert_views = db.prepare(`INSERT OR IGNORE INTO views (date, value) VALUES (?, ?)`)
let db_update_views = db.prepare(`UPDATE views SET value = value + 1 WHERE date = ?`)

let db_set_database = db.prepare('INSERT OR IGNORE INTO cache (url, data) VALUES (?, ?)')

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num
}

let workingList = []

global.watchInterval = setInterval(() => {
    workingList.forEach(async (workingHolder, workingIndex) => {
        let [watchtime_err, currentWatchTime] = await to(workingHolder.watcherContext.time())
        if (watchtime_err) return workingHolder.fail(`Error getting the watchtime: ${watchtime_err}`)

        let watchTimePercent = (100 / workingHolder.job.video_info.duration) * currentWatchTime
        let increase = !workingHolder.job.video_info.isLive ? currentWatchTime : (Date.now() - workingHolder.start_time) / 1000

        var newAmount = increase - workingHolder.lastWatchtime
        var currentTime = getCurrentTime().getTime()

        var alreadyFound = stats.watch_time.filter((v) => v.date == currentTime)
        if (!alreadyFound[0]) {
            stats.watch_time.push({ date: currentTime, value: 0 })
            db_insert_watch_time.run(currentTime, 0)
        }

        stats.watch_time[stats.watch_time.length - 1].value += newAmount
        db_update_watch_time.run(newAmount, currentTime)

        if (!workingHolder.increasedViews && increase > workingHolder.maxWatchtime) {
            workingHolder.increasedViews = true

            let alreadyFound2 = stats.views.filter((v) => v.date == currentTime)
            if (!alreadyFound2[0]) {
                stats.views.push({ date: currentTime, value: 0 })

                db_insert_views.run(currentTime, 0)
            }

            stats.views[stats.views.length - 1].value += 1
            db_update_views.run(currentTime)

            io.emit("increase_views_amount")
        }

        io.emit("increase_watch_time_amount", newAmount)
        io.emit("update_workers", workers)

        workingHolder.worker.currentTime = increase
        workingHolder.lastWatchtime = increase

        if (workingHolder.job.account) {
            if (workingHolder.job.account.like && !workingHolder.liked) {
                if (watchTimePercent >= workingHolder.job.account.likeAt) {
                    workingHolder.liked = true

                    let [like_err] = await to(workingHolder.watcherContext.like())
                    if (like_err) return workingHolder.fail(`Error liking video: ${like_err}`)
                }
            }

            if (workingHolder.job.account.dislike && !workingHolder.disliked) {
                if (watchTimePercent >= workingHolder.job.account.dislikeAt) {
                    workingHolder.disliked = true

                    let [dislike_err] = await to(workingHolder.watcherContext.dislike())
                    if (dislike_err) return workingHolder.fail(`Error disliking video: ${dislike_err}`)                    }
            }

            if (workingHolder.job.account.comment && !workingHolder.commented) {
                if (watchTimePercent >= workingHolder.job.account.commentAt) {
                    workingHolder.commented = true

                    let [comment_err] = await to(workingHolder.watcherContext.comment(workingHolder.job.account.comment))
                    if (comment_err) return workingHolder.fail(`Error creating comment: ${comment_err}`)
                }
            }
        }

        if (!workingHolder.job.video_info.isLive) {
            if (watchTimePercent >= workingHolder.job.watch_time) {
                workingHolder.finish()
            }
        } else {
            if (!workingHolder.job.watch_entire_livestream && (Date.now() - workingHolder.start_time) > workingHolder.job.watch_time * 1000) {
                workingHolder.finish()
            }
        }
    })

    io.emit("update_workers", workers)
}, 500)

function startWorker(job, worker, userDataDir) {
    return new Promise(async (resolve, reject) => {
        let wtfp = !job.isLivestream && (job.video_info.duration / 100) * job.watch_time

        let bot = new youtube_selfbot_api(settings.chromePath, {
            headless: settings.headless,
            userDataDir: path.join(__dirname, `../cache/raw_guest/${userDataDir}`),
            proxy: job.proxy,
            no_visuals: settings.no_visuals,
            autoSkipAds: settings.auto_skip_ads,
            timeout: settings.proxyTimeout * 1000,
            cacheDB: {
                save: (url, data) => {
                    db_set_database.run(url, JSON.stringify(data))
                },
                get: (url) => {
                    let result = db.prepare(`SELECT data FROM cache WHERE url = ?`).get(url)
                    let data = result && result.data && JSON.parse(result.data)
                    if(!data) return

                    return {...data, body: Buffer.from(data.body)}
                }
            }
        })

        let browser
        let failed = false

        children.push({
            child: browser,
            type: "process",
            kill: async function () {
                if (browser) {
                    let [close_browser_err] = await to(browser.close())
                    browser = undefined

                    if (close_browser_err) return reject(`Error closing the browser: ${close_browser_err}`)
                } else if(!failed) {
                    let interval = setInterval(() => {
                        if(browser){
                            this.kill()
                            clearInterval(interval)
                        }
                    }, 500)
                }
            }
        })

        let [launch_error, globalBrowser] = await to(bot.launch())
        if (launch_error) {
            failed = true
            return reject(`Error spawning browser: ${launch_error}`)
        }

        browser = globalBrowser

        browser.on("bandwith", (id, type, len) => {
            len = parseFloat((len / 1e+6).toFixed(2))

            if (type !== "document") {
                var currentTime = getCurrentTime().getTime()

                var alreadyFound = stats.bandwidth.filter((v) => v.date == currentTime)
                if (!alreadyFound[0]) {
                    stats.bandwidth.push({ date: currentTime, value: 0 })
                    db_insert_bandwidth.run(currentTime, 0)
                }

                stats.bandwidth[stats.bandwidth.length - 1].value += len
                db_update_bandwidth.run(len, currentTime)
                worker.bandwidth += len

                io.emit("update_workers", workers)
                io.emit("increase_bandwidth_amount", len)
            }
        })

        let [new_page_err, page] = await to(browser.newPage())
        if (new_page_err) return reject(`Error starting a new page: ${new_page_err}`)

        let googleContext

        if (job.account) {
            let cookies = job.account.cookies

            try {
                cookies = JSON.parse(job.account.cookies)
            } catch (err) { }

            let [google_setup_err, googleContext] = await to(page.setupGoogle(job.account, cookies))
            if (google_setup_err) return reject(`Error creating google context: ${google_setup_err}`)

            let [google_login_err] = await to(googleContext.login(job.account))
            if (google_login_err) return reject(`Error logging into google: ${google_login_err}`)
        } else {
            let [clear_storage_err] = await to(browser.clearStorage())
            if (clear_storage_err) return reject(`Error clearing storage: ${clear_storage_err}`)
        }

        let [goto_video_err, watcherContext] = await to(page.gotoVideo(job.watch_type, job.id, {
            forceFind: true,
            title: job.keyword_chosen,
            filters: job.filters,
        }))

        if (goto_video_err) return reject(`Error going to the video: ${goto_video_err}`)

        if (!job.video_info.isLive) {
            let [week_err] = await to(watcherContext.seek(0))
            if (week_err) return reject(`Error seeking to the start of the video: ${week_err}`)
        }

        let workerHolder = {
            lastWatchtime: 0,
            commented: false,
            disliked: false,
            liked: false,
            increasedViews: false,
            maxWatchtime: ((job.video_info.isShort || job.isLivestream) && 1) || (clamp(wtfp, Math.min(job.video_info.duration, 30), 30)),
            start_time: Date.now(),

            browser: browser,
            watcherContext,
            account: job.account,
            job,
            worker,
            id: v4(),
            killed: false,
            kill: async function () {
                this.killed = true
                workingList = workingList.filter(w => w.id !== this.id)

                if (browser) {
                    let [close_browser_err] = await to(browser.close())
                    if (close_browser_err) return reject(`Error closing the browser: ${close_browser_err}`)
                    browser = undefined
                }
            },
            fail: async function (err) {
                await this.kill()
                reject(err)
            },
            finish: async function () {
                await this.kill()
                resolve()
            }
        }

        workingList.push(workerHolder)

        browser.on("videoStateChanged", async (lastState, newState) => {
            if (newState == "FINISHED") {
                await workerHolder.finish()
            }
        })

        if (job.account && job.video_info.isLive) {
            if (job.account.like) {
                await googleContext.like()
            }

            if (job.account.dislike) {
                await googleContext.dislike()
            }

            if (job.account.comment) {
                await googleContext.comment(job.account.comment)
            }
        }
    })
}

/*function OLD_startWorker(job, worker, userDataDir) {
    return new Promise((resolve, reject) => {
        let isDead = false
        let child = spawn(`node`, [
            path.join(__dirname, "../worker/worker_thread.js"),
            JSON.stringify(job),
            JSON.stringify(settings),
            userDataDir,
        ])

        children.push({
            child,
            type: "process",
            kill: () => {
                isDead = true
                child.kill("SIGINT")
            }
        })

        function requestReceived(request, id) {
            let { type, message } = request

            switch (type) {
                case "getDatabase":
                    let result = db.prepare(`SELECT data FROM cache WHERE url = ?`).get(message)
                    if (result) {
                        sendMessage(JSON.parse(result.data), id)
                    } else {
                        sendMessage(undefined, id)
                    }

                    break
                default:
                //console.log(type)
            }
        }

        function messageReceived(arg) {
            let { type, message } = arg

            switch (type) {
                case "setDatabase":
                    db_set_database.run(message.url, JSON.stringify(message.data))
                    break
                case "video_finished":
                    child.kill("SIGINT")
                    resolve()
                    break
                case "login_failed":
                    child.kill("SIGINT")
                    reject(message)
                    break
                case "bandwith_increase":
                    var newAmount = message - lastBandwidth
                    var currentTime = getCurrentTime().getTime()

                    var alreadyFound = stats.bandwidth.filter((v) => v.date == currentTime)
                    if (!alreadyFound[0]) {
                        stats.bandwidth.push({ date: currentTime, value: 0 })
                        db_insert_bandwidth.run(currentTime, 0)
                    }

                    stats.bandwidth[stats.bandwidth.length - 1].value += newAmount
                    db_update_bandwidth.run(newAmount, currentTime)

                    io.emit("update_workers", workers)
                    io.emit("increase_bandwidth_amount", newAmount)
                    lastBandwidth = message
                    worker.bandwidth = message

                    break
                case "watchtime_increase":
                    var newAmount = message - lastWatchtime
                    var currentTime = getCurrentTime().getTime()

                    var alreadyFound = stats.watch_time.filter((v) => v.date == currentTime)
                    if (!alreadyFound[0]) {
                        stats.watch_time.push({ date: currentTime, value: 0 })
                        db_insert_watch_time.run(currentTime, 0)
                    }

                    stats.watch_time[stats.watch_time.length - 1].value += newAmount
                    db_update_watch_time.run(newAmount, currentTime)

                    if (!increasedViews && message > maxWatchtime) {
                        increasedViews = true

                        let alreadyFound2 = stats.views.filter((v) => v.date == currentTime)
                        if (!alreadyFound2[0]) {
                            stats.views.push({ date: currentTime, value: 0 })

                            db_insert_views.run(currentTime, 0)
                        }

                        stats.views[stats.views.length - 1].value += 1
                        db_update_views.run(currentTime)

                        io.emit("increase_views_amount")
                    }

                    io.emit("increase_watch_time_amount", newAmount)
                    io.emit("update_workers", workers)

                    worker.currentTime = message
                    lastWatchtime = message

                    break
            }
        }

        function sendMessage(arg, id) {
            let data
            let dataType = typeof arg

            switch (dataType) {
                case "object":
                    data = JSON.stringify(arg)
                    break
                default:
                    data = arg && arg.toString()
            }

            child.stdin.write(`--data=${dataType}-:::-${data}-+++-${id}`)
        }

        child.stdout.on("data", (data) => {
            data = data.toString()

            if (data.includes(`--data=`)) {
                let splits = data.split("\n")
                splits.pop()

                for (let newData of splits) {
                    newData = newData.split(`--data=`)[1]
                    if (newData) {
                        let isQuestion = newData.includes("-:q:-")
                        let [dataType, message] = newData.split(isQuestion && "-:q:-" || "-:::-")
                        let questionId

                        if (isQuestion) {
                            let question = message.split("-++-")
                            message = question[0]
                            questionId = question[1]
                        }
                        switch (dataType) {
                            case "undefined":
                                message = undefined
                                break
                            case "object":
                                message = JSON.parse(message)
                                break
                            case "number":
                                message = parseFloat(message)
                                break
                        }

                        if (isQuestion) {
                            requestReceived(message, questionId)
                        } else {
                            messageReceived(message)
                        }
                    }
                }
            } else {
                if (!data.includes(`"expires":`) && !data.includes("Terminated")) {
                    if (data.split(",").length < 50) {
                        console.log(data)
                    }
                }
            }
        })

        child.stderr.on("data", (data) => {
            data = data.toString()

            if (!isDead) {
                if (!data.includes("TLS ServerName") && !data.includes("kill")) {
                    if (data.includes("Error" || data.includes("Node.js"))) {
                        reject(data)
                    } else {
                        console.log(data)
                    }
                }
            }
        })
    })
}*/

export { startWorker }