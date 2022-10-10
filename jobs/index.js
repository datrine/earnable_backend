let CronJob = require('cron').CronJob;
let job = new CronJob("0 * * * * *", function (params) {
    console.log("Job.....")
});
/**
 * @type {Map<string,CronJob}
 */
let jobList = new Map();
/**
 * 
 * @type {(title: string, cronJob:CronJob)=>{}}
 * @returns
 */
let registerJob = (title, cronJob) => {
        jobList.set(title, cronJob);
        if (!cronJob.running) {
            cronJob.start()
        }
        return jobList
    }
let stopAll;
let stopJob;
let startJob;

let startJobs = async () => {
   // registerJob("testingJob",job)
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
    
    return { registerJob, jobList, stopAll, stopJob, startJob }
}

module.exports = { startJobs, stopAll, startJob, stopJob,registerJob ,jobList}
