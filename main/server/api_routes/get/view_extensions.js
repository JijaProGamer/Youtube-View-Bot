module.exports = (req, res) => {
    res.json(extensions.map(extension => {return {...extension, vm: undefined}} ))
}