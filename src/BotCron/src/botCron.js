const { CronJob } = require('cron');

const getTaskData = (taskName, cronParams) => {
  let params = cronParams;

  if (typeof cronParams === 'string') {
    params = JSON.parse(cronParams);
  }

  return { ...params[taskName] };
};

module.exports = (taskName, cronParams, robot, autoStart = true) => {
  const { cron, params } = getTaskData(taskName, cronParams);

  const job = new CronJob(cron, () => {
    robot.emit(taskName, params);
  }, null, autoStart);

  return job;
};
