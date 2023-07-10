# Description

This repository contains the source code for a github app I made as an internship assignment. It monitors a repository and listens to events like PR opening and re-opening, as well as issue comments created and edited under that PR, and executes the code in the PR upon scanning the '/execute' command in either the title of the PR, or in the comments under that PR.

# github-coderunner

> A GitHub App built with [Probot](https://github.com/probot/probot) that github-coderunner probot app for internship assignment

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t github-coderunner .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> github-coderunner
```

## Contributing

If you have suggestions for how github-coderunner could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2023 Tanishk Saxena
