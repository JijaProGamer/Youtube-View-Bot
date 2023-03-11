export type Options = {
    chromePath: string
    close_server_on_finish: boolean,
    no_visuals: boolean,
    headless: boolean,
    concurrency: Number,
    concurrencyInterval: Number,
    timeout: Number,
    disable_proxy_tests: boolean,
    proxy_tests_headless: boolean,
    stop_spawning_on_overload: boolean,
    auto_skip_ads: boolean,
    server_port: Number,
    default_proxy_protocol: string,
};