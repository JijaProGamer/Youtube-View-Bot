import type { Options } from "./types/options"
import axios from "axios";

import io from 'socket.io-client';
let socket = io("/", {
    autoConnect: true,
    reconnectionDelayMax: 1000,
    secure: false,
});

let opts: Options = {
    skip_ads_after: [5, 85],
    max_seconds_ads: 60,
    chromePath: "",
    close_server_on_finish: false,
    no_visuals: false,
    headless: false,
    concurrency: 3,
    concurrencyInterval: 20,
    timeout: 60,
    disable_proxy_tests: false,
    proxy_tests_headless: false,
    server_port: 6554,
    stop_spawning_on_overload: true,
    auto_skip_ads: true,
    default_proxy_protocol: "http",
    kill_zombies: true,
};

let lastData: Options = deepCopy(opts);
let dataChangeFunc = (opts: any) => {}
let newData = (data: any) => {
    opts = data
}


let dataChanged = (newFunc: any) => dataChangeFunc = newFunc

function deepCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj))
}

function deepEqual(x: any, y: any): boolean {
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      ok(x).length === ok(y).length &&
        ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
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