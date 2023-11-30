let systeminformation = require('systeminformation')

async function getHealth(minimal, multiple) {
    let main = {}
    let nodes = []

    if (minimal) {
        let [memory, cpu, load, temperature] = await Promise.all([
            systeminformation.mem(),
            systeminformation.cpu(),
            systeminformation.currentLoad(),
            systeminformation.cpuTemperature(),
        ])

        main = { cpu, memory, load, temperature }
    } else {
        let [memory, cpu, load, temperature, network, disks, os, graphics, system, time] = await Promise.all([
            systeminformation.mem(),
            systeminformation.cpu(),
            systeminformation.currentLoad(),
            systeminformation.cpuTemperature(),
            systeminformation.networkInterfaces(),
            systeminformation.diskLayout(),
            systeminformation.osInfo(),
            systeminformation.graphics(),
            systeminformation.system(),
            systeminformation.time()
        ])

        main = { time, system, cpu, memory, graphics, os, load, disks, network, temperature }
    }

    if (multiple) {
        // Fetch the other nodes and add them to nodes array
        // TODO: Do this later
    }

    global.lastHealth = { main, nodes }

    io.emit("health", lastHealth)
    return lastHealth
}

async function getCPUHealth() {
    let main = {}
    let nodes = []

    let [memory, load] = await Promise.all([
        systeminformation.mem(),
        systeminformation.currentLoad(),
    ])

    main = { load, memory }

    global.lastHealth = { main, nodes }

    io.emit("health", lastHealth)
    return lastHealth
}

function repeat() {
    getCPUHealth().then(() => {
        setTimeout(() => {
            repeat()
        }, 5000)
    })
}

repeat()

/*function repeat() {
    getHealth(true, true).then(() => {
        setTimeout(() => {
            repeat()
        }, 5000)
    })
}

repeat()*/

module.exports = (req, res) => {
    let minimal = req.query.minimal == "true"
    let multiple = req.query.multiple == "true"
    let login = req.query.login == "true"

    if(login){
        return res.json({ connected: true });
    }

    if (minimal && !multiple) {
        res.json(lastHealth)
    } else {
        getHealth(minimal, multiple).then((health) => {
            res.json(health)
        })
    }
}