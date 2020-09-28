# Contributing

Thank you for reading the contributing guidelines of the project. It will help you to make great contributions like reporting issues, creating feature requests, and submitting pull requests.

## Issues, Feature Request & Questions

Before submitting **issues**, **feature requests**, or **questions**, please do a quick search in [Open Issues]() to verify if it was already created. If there is an existing issue, add your comments to that one. 

### Writing Great Issues & Feature Requests

- Provide reproducible steps, what the result of the steps was, and what you expected to happen.
- Avoid listing multiple bugs or requests in the same issue. Always write a single bug or feature request per issue. 
- Avoid adding your issue as a comment to an existing one unless it's for the exact input. Issues can look similar, but have different causes.
- Add screenshots or animated GIFs.

### Submitting Issues 

1. Go to the [Issues]() page, click on [New issue]().
2. Select the **template**. Choose the one that fits to your case. 
   1. Bug
   2. Documentation Bug
   3. Feature request
   4. Question
3. Fill the issue template. Remember to follow the best practices to write Issues and Feature requests.

## Develop Guidelines

### Branching Model

- **Main**: Accepts merges from Features/Issues and Hotfixes
- **Features/Issues**: Always branch off from Main
  
  - Prefix: action/* e.g.: `add/new-command`, `fix/message-issue`
    
  >  Actions available: `add`, `update`, `fix`, and `remove`
  
- **Hotfix**: Always branch off from Main
  
  - Prefix: hotfix/* e.g.: `hotfix/remove-duplicate-load-data`

### Submit contribution

Pull Requests are a great way to keep track of tasks, enhancements, and bugs for the projects. When we are writing them, we must think about how the rest of the team is going to read it? What kind of information we will place in it to make it easy to read and understand their changes?. Follow these practices to help you to write great pull requests.

#### Writing great pull requests

- Choose a descriptive title and add the context of the changes using brakes. 
  - ex: `[gRPC] Add a method`, `[Mux] Add a new route`
- If the pull request fixes an issue:
  - Add the name of the issue as the title. 
    -  e.g.: ISSUE #03: `Use S3 instead of DynamoDB` ---> PR Title: `[ISSUE#03] Use S3 instead of DynamoDB`
  - Add the number of the related issue at the beginning following the pull request template.
    -  e.g.: `Fixes #03` 
- Provide all the information about the changes made in the pull request.
- Add screenshots or animated GIFs.
