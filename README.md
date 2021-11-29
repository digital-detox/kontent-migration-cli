# Kontent Migration CLI

This package is a migration runner for [Kentico Kontent](https://kontent.ai/) CMS. It allows the following instructions:

- Tracking migrations in the project
- Creating new content types
- Migrating content types and content changes across types
- Rolling back any changinges

### Gettings started

`yarn`

### Migration spaces

For each Kentico space you should create a different migrations folder. You can set which migrations folder you will be using with the `MIGRATION_FOLDER` environment variable.

### Commands

| Command               | Action                             |
| --------------------- | ---------------------------------- |
| yarn migrate init     | Initiate the migrations in Kontent |
| yarn migrate make     | Make new Kontent migrations        |
| yarn migrate run      | Run new migrations                 |
| yarn migrate rollback | Roll back existing migrations      |

### Environment Variables

To run this project you will need a number of environment variables

| Variable         | Description                       |
| ---------------- | --------------------------------- |
| API_KEY          | Kontent management API key        |
| PROJECT_ID       | Kontent project ID                |
| ENVIRONMENT      | Kontent environment               |
| MIGRATION_FOLDER | The name of the migrations folder |
| PREVIEW_KEY      | Kontent preview API key           |

### Implementation

This project uses [Kontent Migrate](https://github.com/digital-detox/kontent-migration-cli) all the commands used are abstractions from this library.

## Use Cases

### Making a new migration

**Convention for migration description**

- Should start with a capital letter
- Should start with an imperative mood verb

Examples:

- "Create Micro Copy content-type"
- "Add title field to Page content-type"
- "Remove description from all content-types"
