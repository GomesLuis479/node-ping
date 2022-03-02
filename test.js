const chalk = require("chalk");
const ping = require("ping");

const COLORS = {
  SEVERE: "#ff1000",
  BAD: "#c90d00",
  MODERATE: "#bdab3a",
  GOOD: "#37bd66",
  STAT: "#0b03fc",
};

const SHARED_DATA = {
  last_packet_loss_time: "None",
  pingCount: 0,
  packet_loss_count: 0,
};

const getChalkFormattedBasedOnPing = (message, ping) => {
  let color;
  if (ping > 500) {
    color = COLORS.SEVERE;
  } else if (ping > 350) {
    color = COLORS.BAD;
  } else if (ping > 200) {
    color = COLORS.MODERATE;
  } else {
    color = COLORS.GOOD;
  }

  return chalk.hex(color)(message);
};

const getChalkFormatted = (message, color) => {
  return chalk.hex(color)(message);
};

const LAST_POINTS = [];
const JITTER_BUF_SIZE = 10;

const addAndGetJitter = (nextPoint) => {
  const numberNextPoint = +nextPoint;

  if (LAST_POINTS.length >= JITTER_BUF_SIZE) {
    LAST_POINTS.shift();
  }

  LAST_POINTS.push(numberNextPoint);

  if (LAST_POINTS.length < JITTER_BUF_SIZE) {
    return -1;
  }

  let differencesSum = 0;

  for (let i = 0; i < LAST_POINTS.length - 1; i++) {
    const currElem = LAST_POINTS[i];
    const nextElem = LAST_POINTS[i + 1];

    differencesSum += Math.abs(currElem - nextElem);
  }

  const jitter = differencesSum / LAST_POINTS.length;

  return Math.floor(jitter);
};

const clearJitterBuf = () => {
  LAST_POINTS.splice(0, LAST_POINTS.length);
};

const getWithZeroTens = (ip) => {
  if (ip < 10) {
    return `0${ip}`;
  }

  return `${ip}`;
};

const getWithZeroThousand = (ip) => {
  ip = +ip;

  if (ip < 10) {
    return `   ${ip}`;
  }

  if (ip < 100) {
    return `  ${ip}`;
  }

  if (ip < 1000) {
    return ` ${ip}`;
  }

  return `${ip}`;
};

const getNowTime = () => {
  const now = new Date();

  const hours = getWithZeroTens(now.getHours());
  const mins = getWithZeroTens(now.getMinutes());
  const secs = getWithZeroTens(now.getSeconds());

  return `${hours}:${mins}:${secs}`;
};

const logPingMessage = ({ isError = false, timeInMilliseconds = 1000 }) => {
  const timeString = getNowTime();

  SHARED_DATA.pingCount += 1;

  if (isError) {
    message = getChalkFormattedBasedOnPing(
      `${timeString} | ----- PACKET LOSS ------`,
      1000
    );
    clearJitterBuf();
    SHARED_DATA.last_packet_loss_time = timeString;
    SHARED_DATA.packet_loss_count += 1;
  } else {
    const jitter = addAndGetJitter(timeInMilliseconds);

    const jitterString =
      jitter < 0 ? "-CALC-" : `${getWithZeroThousand(jitter)}ms`;

    const latencyString = ` ${getWithZeroThousand(timeInMilliseconds)}ms`;

    message = getChalkFormattedBasedOnPing(
      `${timeString} | L = ${latencyString} | J = ${jitterString}`,
      timeInMilliseconds
    );
  }

  console.log(message);

  if (SHARED_DATA.pingCount % 30 === 0) {
    infoMessage = getChalkFormatted(
      `[PL] last = ${SHARED_DATA.last_packet_loss_time} count = ${SHARED_DATA.packet_loss_count}`,
      COLORS.STAT
    );
    console.log(infoMessage);
  }
};

const HOST = "8.8.8.8";

const run = async () => {
  try {
    const { time } = await ping.promise.probe(HOST, {
      timeout: 4,
    });
    if (isNaN(time)) {
      logPingMessage({ isError: true });
      return;
    }

    logPingMessage({ timeInMilliseconds: Math.floor(time) });
  } catch (error) {
    logPingMessage({ isError: true });
  }
};

setInterval(() => {
  run();
}, 1100);
