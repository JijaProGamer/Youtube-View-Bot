let { VM } = require("vm2")
const vm = new VM({
    console: "off",
    sandbox: {},
    require: {
        external: true,
        builtin: ['fs', 'path'],
        root: './',
        mock: {
            fs: {
                readFileSync: () => 'Nice try!'
            }
        }
    }
})

let functionInSandbox = vm.run('module.exports = function(who) { console.log("hello "+ who); }');
functionInSandbox('world');