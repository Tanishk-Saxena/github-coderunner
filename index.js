/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
const axios = require('axios');
const { config } = require("dotenv");
config();

const api_key = process.env.JUDGE0_API_KEY;
const url = "https://judge0-ce.p.rapidapi.com/submissions";
const host = "judge0-ce.p.rapidapi.com";

async function getFiles(owner, repo, pull_number, context) {
  let file = await context.octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
    owner,
    repo,
    pull_number,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  file = await axios.get(file.data[0].contents_url);
  return file;
}

async function getPR(url) {
  let pr = await axios.get(url);
  pr = pr.data;
  console.log(pr);
  return [pr.base.user.login, pr.base.repo.name, JSON.stringify(pr.number)];
}

async function getOutput(fileExtension, code, context) {
  let token;
  const executeOptions = {
    method: 'POST',
    url: url,
    params: {base64_encoded: 'true', fields: '*'},
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': api_key,
      'X-RapidAPI-Host': host
    },
    data: {
      language_id: 52,  //hard coded for now, for C++
      source_code: code,
    }
  };
  axios.request(executeOptions).then(function async (response) {
      token = response.data.token;
  }).then(()=>{
    setTimeout(()=>{
      const receiveOptions = {
        method: 'GET',
        url: `${url}/${token}`,
        params: {base64_encoded: 'true', fields: '*'},
        headers: {
            'X-RapidAPI-Key': api_key,
            'X-RapidAPI-Host': host
        }
      };
      axios.request(receiveOptions).then(function (response) {
        let buff = new Buffer.from(response.data.stdout, 'base64');
        let stdout = buff.toString('ascii');
        const pullRequestComment = context.issue({
          body: stdout,
        });
        return context.octokit.issues.createComment(pullRequestComment);
      }).catch(function (error) {
          console.error(error);
      });
    }, 5000);
  }).catch(function (error) {
      console.error(error);
  });
}

module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  app.on("issues.opened", async (context) => {
    console.log("here");
    app.log.info(context);
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    return context.octokit.issues.createComment(issueComment);
  });

  app.on(["pull_request.opened", "pull_request.reopened", "pull_request.edited"], async (context) => {
    let pr = context.payload.pull_request;
    let title = pr.title;
    if(title.includes("/execute")){
      let owner = pr.base.user.login;
      let repo = pr.base.repo.name;
      let pull_number = JSON.stringify(pr.number);
      let file = await getFiles(owner, repo, pull_number, context);
      let fileExtension = file.data.name.split('.')[1];
      let code = file.data.content;
      await getOutput(fileExtension, code, context);
    }
  })

  app.on(["issue_comment.created", "issue_comment.edited"], async(context) => {
    let pr = context.payload.issue.pull_request;
    if(pr){
      if(context.payload.comment.body.includes("/execute") && context.payload.comment.user.id !== 139039108){
        let url = pr.url;
        let [owner, repo, pull_number] = await getPR(url);
        let file = await getFiles(owner, repo, pull_number, context);
        let fileExtension = file.data.name.split('.')[1];
        let code = file.data.content;
        await getOutput(fileExtension, code, context);
      }
    }
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
