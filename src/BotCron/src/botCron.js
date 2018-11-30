const fs = require('fs');

const { CronJob } = require('cron');

const getTaskData = (taskName) => {
  const [file, taskLabel] = taskName.split('/');
  const taskData = fs.readFileSync(`${__dirname}/../../../config/cronTasks/${file}.json`);

  return { ...JSON.parse(taskData)[taskLabel], taskLabel };
};

module.exports = (taskName, robot, autoStart = true) => {
  const { cron, params, taskLabel } = getTaskData(taskName);

  const job = new CronJob(cron, () => {
    robot.emit(taskLabel, params);
  }, null, autoStart);

  return job;
};
