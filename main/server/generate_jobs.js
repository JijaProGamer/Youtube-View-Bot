import youtubeSelfbotApi from 'youtube-selfbot-api';
let selfbot_api = new youtubeSelfbotApi()

let accountOnlyTypes = ["suggestions", "subscribers"]

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num
}

function calculateAction(work_video) {
    let likePercent = clamp(work_video.likePercent, 0, 100)
    let dislikePercent = clamp(work_video.likePercent, 0, 100)
    let percent1 = Math.random() * 100
    let percent2 = Math.random() * 100

    if (percent1 < likePercent) {
        return "like"
    }

    if (percent2 < dislikePercent) {
        return "dislike"
    }
}

function generateJob(work_video, work_proxies, video_id, videoInfo, work_account) {
    let available_watch_types = work_video.available_watch_types
    if (!work_account) {
        available_watch_types = available_watch_types
            .filter(v => !accountOnlyTypes.includes(v))
    }

    let job = {}

    let filters = {}
    let keyword = random([...work_video.keywords, videoInfo.title])

    if (work_video.filters.duration !== "any") filters.duration = work_video.filters.duration.split(" minutes")[0].replace(" ", "_")
    if (work_video.filters.sort_by !== "relevance") filters.sort_by = work_video.filters.sort_by.replace(" ", "_")
    if (work_video.filters.upload_date !== "any") filters.upload_date = work_video.filters.upload_date.replace(" ", "_")
    if (work_video.filters.features.length > 0) filters.features = work_video.filters.features

    job.keyword_chosen = keyword || ""
    job.video_info = videoInfo
    job.filters = filters
    job.watch_type = random(available_watch_types)
    job.proxy = random(work_proxies)
    job.id = video_id

    if (videoInfo.isLive) {
        job.watch_time = work_video.livestream_watchtime
        job.watch_entire_livestream = work_video.watch_entire_livestream
        job.isLivestream = true
    } else {
        job.watch_time = random(work_video.watch_time[0], work_video.watch_time[1])
    }

    if (work_account) {
        let action = calculateAction(work_video)
        let comment
        if (work_video.comments.length > 0) {
            let comment_index = random(0, work_video.comments.length)
            comment = work_video.comments[comment_index]

            work_video.comments.splice(comment_index, 1);
        }

        job.account = {
            ...work_account,
            like: action == "like",
            dislike: action == "dislike",
            comment: comment,
            likeAt: random(work_video.likeAt[0], work_video.likeAt[1]),
            dislikeAt: random(work_video.dislikeAt[0], work_video.dislikeAt[1]),
            commentAt: random(work_video.commentAt[0], work_video.commentAt[1]),
        }

        if(job.account.like && job.watch_time < (job.account.likeAt + 10)) {job.watch_time = job.account.likeAt + 10}
        if(job.account.dislike && job.watch_time < (job.account.dislikeAt + 10)) {job.watch_time = job.account.dislikeAt + 10}
        if(job.account.comment && job.watch_time < (job.account.commentAt + 10)) {job.watch_time = job.account.commentAt + 10}
    }

    jobs.push(job)
}

async function generateJobs(work_video, work_proxies) {
    let video_id = selfbot_api.getID(work_video.id)
    let videoInfo = await selfbot_api.getVideoInfo(video_id)

    for (let i = 0; i < work_video.guest_views; i++) {
        generateJob(work_video, work_proxies, video_id, videoInfo)
    }

    for (let account of work_video.accounts) {
        generateJob(work_video, work_proxies, video_id, videoInfo, account)
    }

    jobs = jobs
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
}

export { generateJobs }