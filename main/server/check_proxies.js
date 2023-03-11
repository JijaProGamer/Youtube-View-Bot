import createProxyTester from 'fast-proxy-tester';

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
            })

            tester.testPrivacy().then((result) => {
                finished += 1

                if (!resolved) {
                    if (result.privacy == "elite") {
                        tester.fastTest(`https://www.youtube.com`).then((result) => {
                            proxyStats.good.push({ url: proxy, latency: result.latency })
                            proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                            good_proxies = proxyStats.good
                            db.prepare("UPDATE good_proxies SET data = ? WHERE id = 1").run(JSON.stringify(good_proxies))
                            io.emit("newProxiesStats", proxyStats)

                            if (finished == needed) {
                                console.log(1)
                                resolved = true
                                resolve()
                            }
                        }).catch((error) => {
                            if (error == "timeout") {
                                proxyStats.bad.push({ url: proxy, err: "proxy is too slow" })
                                proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                                io.emit("newProxiesStats", proxyStats)
                            } else {
                                proxyStats.bad.push({ url: proxy, err: error.message })
                                proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                                io.emit("newProxiesStats", proxyStats)
                            }

                            if (finished == needed) {
                                console.log(1)
                                resolved = true
                                resolve()
                            }
                        })
                    } else {
                        proxyStats.bad.push({ url: proxy, err: "Proxy is leaking IP address" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)

                        if (finished == needed) {
                            console.log(1)
                            resolved = true
                            resolve()
                        }
                    }
                }
            }).catch((error) => {
                finished += 1

                if (!resolved) {
                    if (error == "timeout") {
                        proxyStats.bad.push({ url: proxy, err: "proxy is too slow" })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)
                    } else {
                        proxyStats.bad.push({ url: proxy, err: error.message })
                        proxyStats.untested = proxyStats.untested.filter((v) => v.url !== proxy)

                        io.emit("newProxiesStats", proxyStats)
                    }

                    if (finished == needed) {
                        resolved = true
                        resolve()
                    }
                }
            })
        }
    })
}

export { checkProxies }