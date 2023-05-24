import createProxyTester from 'fast-proxy-tester';
const ytdl = require('ytdl-core');

function checkProxies(proxies) {
    return new Promise((resolve, reject) => {
        proxies = proxies.filter((v) => v.url !== "direct://")

        let resolved = false
        let finished = 0
        let needed = proxies.length

        setTimeout(() => {
            if (!resolved) resolve()
        }, settings.timeout * 1000 + 1000)

        if (needed == 0) return resolve()

        for (let proxy of proxies) {
            proxy = proxy.url

            let tester = new createProxyTester(proxy, settings.timeout * 1000)

            children.push({
                kill: () => {
                    resolved = true
                    resolve()
                },
            });

            (async () => {
                try {
                    function onError(error){
                        finished ++

                        if (error == "timeout") {
                            proxyStats.bad.push({ url: proxy, err: "proxy is too slow" })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                            io.emit("newProxiesStats", proxyStats)
                        } else {
                            proxyStats.bad.push({ url: proxy, err: error.message })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                            io.emit("newProxiesStats", proxyStats)
                        }
                        throw err
                    }
    
                    let privacy = await tester.testPrivacy().catch(onError)
                    if (privacy.privacy !== "elite") {
                        proxyStats.bad.push({ url: proxy, err: "Proxy is leaking IP address" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    let test1Result = await tester.fastTest(`https://www.youtube.com`).catch(onError)
                    if(test1Result.status !== 200){
                        proxyStats.bad.push({ url: proxy, err: "Proxy is unable to connect to youtube servers" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)
                        return
                    }

                    await ytdl.getBasicInfo("dQw4w9WgXcQ").catch(onError) // Test 2 YTDL

                    proxyStats.good.push({ url: proxy, latency: test1Result.latency })
                    proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                    finished ++
                    good_proxies = proxyStats.good
                    db.prepare("UPDATE good_proxies SET data = ? WHERE id = 1").run(JSON.stringify(good_proxies))
                    io.emit("newProxiesStats", proxyStats)

                    if (finished == needed) {
                        resolved = true
                        resolve()
                    }
                } catch (err) {}
            })()
        }
    })
}

export { checkProxies }