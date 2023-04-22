let Papa = require("papaparse")
let XLSX = require("xlsx");

const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

module.exports = (data, socket) => {
    let video_found = videos.filter((video) => video.id = data.video.id)[0]
    if (!video_found) {
        return
    }

    switch (data.fileType) {
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            let workbook = XLSX.read(data.data)
            let sheet = workbook.Sheets[workbook.SheetNames[0]]
            let range = sheet["!ref"].split(":")[1]
            let types_names = Object.keys(sheet)
                .filter((key) => key[1] == "1")
                .map((v) => sheet[v].w)

            let email_coloumn = alphabet[types_names.indexOf("email")]
            let password_coloumn = alphabet[types_names.indexOf("password")]
            let cookies_coloumn = alphabet[types_names.indexOf("cookies")]

            for (let row = 2; row <= parseInt(range[1]); row++) {
                let email = sheet[email_coloumn + row] ? sheet[email_coloumn + row].w : ""
                let password = sheet[password_coloumn + row] ? sheet[password_coloumn + row].w : ""
                let cookies = sheet[cookies_coloumn + row] ? sheet[cookies_coloumn + row].w : ""

                video_found.accounts.push({ email: email, password: password, cookies: cookies })
            }
            break;
        case "text/csv":
            let cvs_data = Papa.parse(data.data.toString(), { header: true })
            for (let account of cvs_data.data) {
                video_found.accounts.push(account)
            }

            break;
        case "text/plain":
            let text_data = data.data.toString().split("\n")
            for (let cookies of text_data) {
                cookies = cookies.trim()

                if (cookies.length > 0) {
                    video_found.accounts.push({ email: "", password: "", cookies: cookies })
                }
            }

            break;
    }

    for (let video of videos) {
        if (video.id == data.video.id) video = video_found
    }

    db.prepare("UPDATE videos SET data = ? WHERE id = 1").run(JSON.stringify(videos))
    socket.broadcast.emit("videosChanged", videos)
}