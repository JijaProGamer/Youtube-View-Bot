import path from 'path';
import { readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { to } from 'await-to-js';
import { v4 } from 'uuid';

import "./server/init_start.js";
import "./server/init_server.js";

let proxyFormats = ["socks5", "socks4", "http", "https"]
global.routes = {}

let dirname = path.dirname(fileURLToPath(import.meta.url));

for (let folder of readdirSync(path.join(dirname, "/server/api_routes"))) {
    let stat = statSync(path.join(dirname, "/server/api_routes", folder))

    if (stat && stat.isDirectory()) {
        if (!routes[folder]) routes[folder] = []

        for (let route of readdirSync(path.join(dirname, "/server/api_routes", folder))) {
            let routeName = route.split(".")[0]
            routes[folder][routeName] = require(path.join(dirname, "/server/api_routes", folder, route))
        }
    }
}
//app.set('trust proxy', 1)

route.get("/:method", (req, res) => {
    let api = req.path.split("/").pop()
    routes.get[api](req, res)
})

route.post("/:method", (req, res) => {
    let api = req.path.split("/").pop()
    routes.post[api](req, res)
})

io.on("connection", (socket) => {
    socket.use((packet, next) => {
        let api = routes.socket[packet[0]]

        if (api) {
            api(packet[1], socket)
        }
    });
})

global.children = []

import createProxyTester from 'fast-proxy-tester';
let urlTesterInstance = new createProxyTester("", 0)

import { checkProxies } from './server/check_proxies.js';
import { generateJobs } from './server/generate_jobs.js';
import { startWorker } from "./server/startWorker.js"

global.startWorking = startWorking
global.startWorker = startWorker

let lastInterval

let wasChecking = false
let killed = false

process.on("SIGINT", () => {
    for (let child of children) {
        child.kill("SIGINT")
    }

    if (watchInterval) {
        clearInterval(watchInterval)
        watchInterval = undefined
    }

    db.close()
    process.exit(0)
})

async function startWorking() {
    io.emit("workerStatusChanged", workingStatus)

    switch (workingStatus) {
        case 0: // Kill all workers and proxy testers
            if (lastInterval) clearInterval(lastInterval)
            if (wasChecking) killed = true

            proxyStats = { good: [], bad: [], untested: [] }
            workers_finished = []
            workers = []
            jobs = []

            io.emit("update_workers", workers)
            io.emit("newProxiesStats", proxyStats)

            for (let child of children) {
                child.kill("SIGINT")
            }
            break
        case 1: // Start proxy testing and create workers on test success
            if (proxies.length < 1) {
                workingStatus = 0
                io.emit("workerStatusChanged", workingStatus)
                startWorking(0)

                return
            }

            wasChecking = true

            let old_good_proxies = JSON.parse(db.prepare(`SELECT data FROM good_proxies WHERE id = 1`).pluck().get())

            for (let proxy of proxies) {
                if (proxy.length >= 4) {
                    proxy = proxy.trim()

                    if (proxy == "direct://") {
                        proxyStats.good.push({ url: proxy })
                        io.emit("newProxiesStats", proxyStats)
                    } else {
                        let newProxyUrl = proxy.includes("://") ? proxy : `${settings.default_proxy_protocol}://${proxy}`
                        let isGood = urlTesterInstance.testProxyURL(newProxyUrl)

                        if (!isGood.isValid || !proxyFormats.includes(isGood.protocol)) {
                            proxyStats.bad.push({ url: newProxyUrl, err: isGood.err || "invalid protocol" })
                        } else {
                            let oldTry = old_good_proxies.find((v) => v.url == newProxyUrl)

                            if (oldTry) {
                                proxyStats.good.push({ url: newProxyUrl })
                            } else {
                                proxyStats.untested.push({ url: newProxyUrl })
                            }
                        }
                    }
                }
            }

            if(settings.disable_proxy_tests){
                proxyStats.good.push(...proxyStats.untested)
                proxyStats.untested = []
            }

            io.emit("newProxiesStats", proxyStats)

            checkProxies(proxyStats.untested).then(async () => {
                wasChecking = false

                if (!killed) {
                    if (videos.length > 0 && proxyStats.good.length > 0) {
                        let work_videos = videos
                        let work_proxies = proxyStats.good.map((v) => v = v.url)

                        for (let video of work_videos) {
                            if (video.id.trim().length >= 7)
                                await generateJobs(video, work_proxies)
                        }
                    }

                    workingStatus = 2
                    startWorking(2)
                }
            })

            break
        case 2: // Start working
            let currentOpen = 0
            let currentWorker = -1
            let workersFinished = 0
            let availableUserDataDirs = []

            let lastOpened = Date.now() - 1000 * (settings.concurrencyInterval + 1.5)
            let maxWorkers = jobs.length
            let currentConcurrency = parseInt(settings.concurrency)

            for (let dataDir = 0; dataDir < currentConcurrency; dataDir++) availableUserDataDirs.push(dataDir)

            lastInterval = setInterval(async () => {
                if (Date.now() > (settings.concurrencyInterval * 1000 + lastOpened)) {

                    if (settings.stop_spawning_on_overload) {
                        if (!lastHealth || !lastHealth.main) return

                        let cpuLoad = lastHealth.main.load.currentLoad
                        let ramLoad = (lastHealth.main.memory.active / lastHealth.main.memory.total) * 100

                        if (cpuLoad > 95 || ramLoad > 90) return
                    }

                    if (currentOpen >= currentConcurrency) return

                    lastOpened = Date.now()

                    let currentJob = jobs[currentWorker + 1]
                    if (currentJob) {
                        currentOpen += 1
                        currentWorker += 1

                        let tempWorker = currentWorker
                        let userDataDir = tempWorker

                        if (typeof availableUserDataDirs[0] !== "undefined") {
                            userDataDir = availableUserDataDirs.shift()
                        }

                        let worker = {
                            job: currentJob,
                            logs: [],

                            id: v4(),

                            bandwidth: 0,
                            currentTime: 0,

                            startTime: Date.now(),
                            video_info: currentJob.video_info,
                        }

                        workers.push(worker)
                        io.emit("update_workers", workers)

                        let [err, result] = await to(startWorker(currentJob, worker, userDataDir))
                        //if(err){
                        if (err && !err.includes("closed") && !err.includes("disconnected") && !err.includes("Protocol")) {
                            console.log(err)
                        }

                        workers = workers.filter((v) => v.id !== worker.id)
                        workers_finished.push(worker)

                        availableUserDataDirs.push(userDataDir)

                        io.emit("update_workers", workers)

                        currentOpen -= 1
                        workersFinished += 1

                        if (workersFinished == maxWorkers) {
                            clearInterval(lastInterval)
                            lastInterval = undefined

                            workingStatus = 0
                            startWorking(0)
                        }
                    }

                }
            }, 1000)

            break
    }
}