# Automated Dev Workflow Example with Github Actions
Example of how Github Action (or any CI/CD tool) can be used to automate scheme changes to the content model. This is intended as an simple example of a dev workflow and may need to be altered to fit a production workflow.

Upon making a pull request from a git feature branch to the main branch, if new migration files exist, a new Contentful environment will be created with those migrations applied and the `development` alias will target the new environment for testing. 

If the pull request is merged, the migration will be applied to the `main` Contentful environment. 

When a pull request is closed (either merged or just closed) the development alias will be updated to point at main again and the environment created for testing the changes will be deleted.

## Setup
1. Run `nvm use`
2. Run `npm install` 
3. Create an empty space in Contentful
4. Create an [environment alias](https://www.contentful.com/developers/docs/concepts/environment-aliases/) called `master`
5. Create an environment called `main` and set `master` alias to target `main`
6. Create an environment alias called `development` and set it to target `main`
7. Import starting content model to `main` with command `space migration --e=main setup/content-model.js `
8. In Github, setup two [Action secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets). 
    - `CF_SPACE_ID`: ID of the Contentful space to target.
    - `CF_CMA_KEY`: [Contentful Management API personal access token](https://www.contentful.com/developers/docs/references/authentication/#the-content-management-api)

 

## Using the workflow
1. Clone main environment – this is where "local" changes to the content model will be made.
2. Upon completing content model changes, use [Merge](https://www.contentful.com/marketplace/app/merge/) to generate migration script. 
3. In git, create feature branch from main and place generated migration script in in `/migration` directory. Recommend using number or date naming convention for naming migration scripts, newly added script will run in alphabetical order.
4. Push feature branch to remote.
5. In Github, make pull request where `main` is the base and it is being compared with the `feature`.
    - This will trigger the `main-pull-request-opened` action
    - A Contentful environment will be cloned from `main` with the name of the pull request and its number
    - The migrations applied to this environment
    - The `development` alias will target this newly created environment
6. Test the changes in `development`
7. Upon completion of testing:
   - If successful, use the pull request to merge the changes
     - This will trigger the `main-push` action
     - The migration will be applied to the `main` environment
     - When a pull request is merged, this also closes the pull request and will trigger the `main-pull-request-closed` action to remove the testing environment
   - If the testing fails, close the pull request
     - This will trigger the `main-pull-request-closed` action
     - The `development` alias will be updated to target `main`
     - The environment created for testing will be deleted