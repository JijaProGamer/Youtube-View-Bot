import youtubeSelfbotApi from 'youtube-selfbot-api';
let selfbot_api = new youtubeSelfbotApi()

let accountOnlyTypes = ["suggestions", "subscribers"]

function generateJob(work_video, work_proxies, video_id, videoInfo, work_account) {
    let available_watch_types = work_video.available_watch_types
    if(!work_account){
        available_watch_types = available_watch_types
                .filter(v => !accountOnlyTypes.includes(v))
    }

    let job = {}

    if(videoInfo.isLive){
        job.watch_time = work_video.livestream_watchtime
        job.watch_entire_livestream = work_video.watch_entire_livestream
        job.isLivestream = true
    } else {
        job.watch_time = random(work_video.watch_time[0], work_video.watch_time[1])
    }

    let filters = {}
    let keyword = random([...work_video.keywords, videoInfo.title])

    if(work_video.filters.duration !== "any") filters.duration = work_video.filters.duration.split(" minutes")[0].replace(" ", "_")
    if(work_video.filters.sort_by !== "relevance") filters.sort_by = work_video.filters.sort_by.replace(" ", "_")
    if(work_video.filters.upload_date !== "any") filters.upload_date = work_video.filters.upload_date.replace(" ", "_")
    if(work_video.filters.features.length > 0) filters.features = work_video.filters.features

    job.keyword_chosen = keyword || ""
    job.video_info = videoInfo
    job.filters = filters
    job.watch_type = random(available_watch_types)
    job.proxy = random(work_proxies)
    job.id = video_id

    if (work_account) {
        job.account = {
            ...work_account,
            likeAt: random(work_account.likeAt[0], work_account.likeAt[1]),
            dislikeAt: random(work_account.dislikeAt[0], work_account.dislikeAt[1]),
            commentAt: random(work_account.commentAt[0], work_account.commentAt[1]),
        }
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