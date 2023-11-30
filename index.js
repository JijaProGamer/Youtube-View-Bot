const { app, BrowserWindow, shell } = require('electron')
const { spawn } = require("child_process")
const path = require("path")
require("ansicolor").nice

function runServer() {
    return new Promise((resolve, reject) => {
        let child = spawn("node", [path.join(__dirname, "/main/server.js")])
        let resolved = false

        child.stdout.on("data", (data) => {
            data = data.toString()

            if (data.includes("listening")) {
                let port = data.split("|")[1]

                resolved = true
                resolve({ server: child, port })
            } else {
                if (!resolved) {
                    resolved = true
                    reject(data)
                } else {
                    console.log(`INFO: `.blue + data.trim())
                }
            }
        })

        child.stderr.on("data", (data) => {
            data = data.toString()

            console.log(`ERROR: `.red + data)
        })

        child.on('close', (code, signal) => {
            process.exit(0)
        });
    })
}

runServer().then((srv_data) => {
    let { server, port } = srv_data

    const createWindow = () => {
        const win = new BrowserWindow({
            title: "Youtube-View-Bot",
            autoHideMenuBar: true,
            //icon: path.join(__dirname, "/main/static/favicon.ico"),
            webPreferences: {
                nodeIntegration: false,
                nodeIntegrationInWorker: false,
            }
        })

        win.webContents.on('will-navigate', function (e, url) {
            if (url.includes("patreon") || url.includes("github") || url.includes("paypal") || url.includes("bloxxy.net") || url.includes("iproyal.com")) {
                e.preventDefault();
                shell.openExternal(url);
            }
        });

        win.maximize();
        win.loadURL(`http://localhost:${port}`).then(() => {
            win.reload()
        })
    }

    app.on('window-all-closed', async () => {
        await server.kill("SIGINT")
        process.exit(0)

        /*if (process.platform !== 'darwin') {
            await app.quit()

            console.time("start")
            await server.kill("SIGINT")
            console.timeEnd("start")

            process.exit(0)
        }*/
    })

    app.whenReady().then(() => {
        createWindow()
    })
})

process.stdin.on("data", (data) => {
    data = data.toString()

    //console.log(data.toString())
})