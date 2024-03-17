const exec = require('child_process').exec;

function getEBVersionLabel() {
  const command =
    'aws elasticbeanstalk  describe-application-versions --application-name wooriga-backend';

  exec(command, (error, stdout, stderr) => {
    if (error !== null) {
      throw new Error(error);
    }

    const result = JSON.parse(stdout);
    const latestVersion = result['ApplicationVersions'][0]['VersionLabel'];

    console.log(latestVersion);
  });
}

getEBVersionLabel();
