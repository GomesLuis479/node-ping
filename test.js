const ping = require("net-ping");
const csv = require("csv");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const chalk = require("chalk")

const COLORS = {
  SEVERE: "#ff1000",
  BAD:"#c90d00",
  MODERATE:"#bdab3a",
  GOOD:"#37bd66",
}


const getChalkFormattedBasedOnPing=(message, ping) =>{
  let color;
  if(ping > 500) {
    color = COLORS.SEVERE
  } else if( ping > 350) {
    color = COLORS.BAD
  } else if(ping > 200) {
    color = COLORS.MODERATE
  } else {
    color = COLORS.GOOD
  }


  return chalk.hex(color)(message);
}



const writeToFile = async (ping) => {
  try {
    const csvWriter = createCsvWriter({
      path: "temp.csv",
      header: [
        { id: "time", title: "TIME" },
        { id: "ping", title: "PING" },
      ],
      append:true
    });

    const records = [{ time: (new Date()).toISOString(), ping }];

    await csvWriter.writeRecords(records);
  } catch (error) {
    console.log(error.message);
  }
};

const run = () => {
  const options = {
    networkProtocol: ping.NetworkProtocol.IPv4,
    packetSize: 16,
    retries: 0,
    sessionId: process.pid % 65535,
    timeout: 4000,
    ttl: 128,
  };

  const session = ping.createSession();

  session.pingHost("8.8.8.8", function (error, target, sent, rcvd) {
    if (error) {
      const message = getChalkFormattedBasedOnPing(`FAILED: ${new Date()} ---------------`, 1000)
      console.log(message);
      writeToFile(-1)
    } 
    else {
      const timeDiffMilis = rcvd - sent;
      const message = getChalkFormattedBasedOnPing(`SUCCESS: ${new Date()}: response time ${timeDiffMilis}ms`, timeDiffMilis)
      console.log(message);
      writeToFile(timeDiffMilis)
    }

    session.close();
  });
};

setInterval(() => {
  run();
}, 5000);



