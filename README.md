# Royco Subgraphs and Pipelines

## Notes

- All subgraphs and pipelines are deployed individually for each chain with two versions (recipe & vault)
- All the commands should be run from the root of the corresponding subgraph/pipeline directory, i.e. <royco-recipe/vault-chain_id>
- The name of the directory is composed of following: royco-<MARKET_TYPE>-<CHAIN_ID>, where MARKET_TYPE can be 'recipe' or 'vault'

## Commands to manage subgraphs and pipelines

### Deploy Subgraph

```bash
goldsky subgraph deploy <NAME>/<VERSION> --path .
```

### Deploy Pipeline

```bash
goldsky pipeline apply <NAME>.yaml
```

## New version deployment (Subgraph + Pipeline)

- Delete existing pipeline
- Delete existing subgraph
- Increment the version number in <royco-recipe/vault-version>.yaml
- Increment the version number in <royco-recipe/vault-version>/README.md
- Deploy new subgraph
- Deploy new pipeline

## Reference Link for accessing deployed subgraph

```
https://api.goldsky.com/api/public/project_<PROJECT_ID>/subgraphs/<NAME>/<VERSION>/gn
```
