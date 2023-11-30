import type { Options } from "./types/options"
import axios from "axios";

import io from 'socket.io-client';
let socket = io("/", {
    autoConnect: true,
    secure: false,
});

let opts: Options = {
    skip_ads_after: [5, 85],
    max_seconds_ads: 60,
    close_server_on_finish: false,
    headless: false,
    api_key: "",
    concurrency: 3,
    concurrencyInterval: 20,
    timeout: 60,
    disable_proxy_tests: false,
    server_port: 6554,
    stop_spawning_on_overload: true,
    auto_skip_ads: true,
    default_proxy_protocol: "http",
};

let lastData: Options = deepCopy(opts);
let dataChangeFunc = (opts: any) => { }
let newData = (data: any) => {
    opts = data
}

let dataChanged = (newFunc: any) => dataChangeFunc = newFunc

function deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj))
}

function deepEqual(a: any, b: any): boolean {
    if (a && b && typeof a == 'object' && typeof b == 'object') {
        if (Object.keys(a).length != Object.keys(b).length) return false;
        for (var key in a) if (!deepEqual(a[key], b[key])) return false;
        return true;
    } else return a === b
}


function publishData() {
    axios.post("/api/settings", opts)
}

axios.get("/api/settings").then((result) => {
    opts = result.data
    lastData = deepCopy(result.data)
    dataChangeFunc(opts)
})

setInterval(() => {
    if (!deepEqual(opts, lastData)) {
        lastData = deepCopy(opts)
        publishData()
    }
}, 100)

socket.on("settings", (data) => {
    opts = data
    lastData = deepCopy(opts)

    dataChangeFunc(opts)
})

socket.on("reconnect", () => {
    window.location.reload();
})

export { socket, opts, dataChanged, newData }