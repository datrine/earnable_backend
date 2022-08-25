let CronJob = require('cron').CronJob;
let job = new CronJob("0 * * * * *", function (params) {
    console.log("Job.....")
});
/**
 * @type {Map<string,CronJob}
 */
let jobList;
/**
 * 
 * @type {(title: string, cronJob:CronJob)=>{}}
 * @returns
 */
let registerJobs
let stopAll;
let stopJob;
let startJob;

let startJobs = async () => {
    jobList = new Map();
    registerJobs = (title, cronJob) => {
        jobList.set(title, cronJob);
        return jobList
    }
    for (const [title, job] of jobList) {
        job.start()
    }
    let stopAll = () => {
        for (const [title, job] of jobList) {
            job.stop()
        }
    }
    let stopJob = (title) => {
        jobList.get(title).stop()
    }
    let startJob = (title) => {
        jobList.get(title).start()
    }
    return { registerJobs, jobList, stopAll, stopJob, startJob }
}

module.exports = { startJobs, stopAll, startJob, stopJob }
