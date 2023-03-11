module.exports = (req, res) => {
    let { password } = req.body

    password = password && password.trim() || ""
    server_password_global = password

    let server_password = db.prepare(`SELECT * FROM srv_password`).pluck().get()

    if (typeof server_password !== "undefined") {
        db.prepare('UPDATE srv_password SET password = ? WHERE id = 1').run(password)
    } else {
        db.prepare('INSERT OR IGNORE INTO srv_password (password, id) VALUES (?, 1)').run(password)
    }

    if (password.length > 0)
        return res.redirect('/login')

    res.redirect("/")
}