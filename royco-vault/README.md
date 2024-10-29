## Subgraph Commands

### Delete Subgraphs Bash Script

```bash
./delete-subgraphs.sh
```

### Deploy New Subgraphs Bash Script

```bash
./deploy-subgraphs.sh
```

### Prepare, codegen, build

```bash
yarn prepare:<network> && graph codegen && graph build
```

### Deploy

```bash
goldsky subgraph deploy royco-vault-<network>/<version> --path .
```

### Pause

```bash
goldsky subgraph pause royco-vault-<network>/<version>
```

### Delete

```bash
goldsky subgraph delete royco-vault-<network>/<version>
```

## Pipeline Commands

### Update

```bash
goldsky pipeline apply royco-vault.yaml
```

### Stop

```bash
goldsky pipeline stop royco-vault
```

### Delete

```bash
goldsky pipeline delete royco-vault
```
