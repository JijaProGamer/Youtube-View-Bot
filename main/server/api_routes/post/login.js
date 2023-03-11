module.exports = (req, res) => {
    let { password } = req.body

    if (password) {
        if (password == server_password_global) {
            req.session.loggedIn = true
            req.session.server_password = server_password_global

            return res.redirect('/')
        } 
            
        return res.sendStatus(403)
    }
        
    return res.sendStatus(400)
}