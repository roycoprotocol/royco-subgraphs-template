# Royco Subgraphs and Pipelines

## Commands to deploy subgraphs

`cd` into the subgraph directory and run the following commands for each directory: `royco-recipe` and `royco-vault`

1. Delete Old Subgraphs (Only go through this step if you have already deployed the subgraphs once)

> Note: Don't forget to update the correct version in the delete-subgraphs.sh file

```bash
./delete-subgraphs.sh
```

2. Deploy New Subgraphs

> Note: Don't forget to update the correct version in the deploy-subgraphs.sh file

```bash
./deploy-subgraphs.sh
```

### Commands to deploy pipeline

`cd` into the `royco-goldsky-pipeline` directory and run the following command:

> Note: Don't forget to update the correct version in `config/versions.json` file with latest version of `royco-recipe` and `royco-vault` subgraphs

```bash
./deploy-new-pipelines.sh
```

> The bash script will delete the exisiting pipeline and deploy a new one.
