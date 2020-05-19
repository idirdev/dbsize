# dbsize

> **[EN]** A CLI tool and library to measure directory sizes on disk and estimate database table and schema sizes from a column schema definition.
> **[FR]** Un outil CLI et une bibliothèque pour mesurer la taille des répertoires sur disque et estimer la taille des tables et schémas de base de données à partir d'une définition de colonnes.

---

## Features / Fonctionnalités

**[EN]**
- Measure the total size of any directory recursively
- Estimate row size in bytes from a column schema (INT, VARCHAR, TEXT, JSON, UUID, etc.)
- Estimate table size including index overhead (30%)
- Estimate full database size from multiple table definitions
- Human-readable output (B, KB, MB, GB, TB)
- Parse and convert size strings programmatically

**[FR]**
- Mesurer la taille totale d'un répertoire de façon récursive
- Estimer la taille d'une ligne en octets à partir d'un schéma de colonnes
- Estimer la taille d'une table avec surcharge d'index (30%)
- Estimer la taille complète d'une base de données à partir de plusieurs tables
- Sortie lisible (B, KB, MB, GB, TB)
- Analyser et convertir des chaînes de taille par programmation

---

## Installation

```bash
npm install -g @idirdev/dbsize
```

---

## CLI Usage / Utilisation CLI

```bash
# Measure a directory size
# Mesurer la taille d'un répertoire
dbsize --dir /var/www/myapp

# Measure current directory
# Mesurer le répertoire courant
dbsize --dir .

# Show help / Afficher l'aide
dbsize --help
```

### Example Output / Exemple de sortie

```
$ dbsize --dir /var/www/myapp
Directory: /var/www/myapp
Size: 142.37 MB

$ dbsize --dir .
Directory: .
Size: 4.21 KB
```

---

## API (Programmatic) / API (Programmation)

**[EN]** Use dbsize as a library to estimate database sizes before provisioning.
**[FR]** Utilisez dbsize comme bibliothèque pour estimer les tailles de base de données avant le provisionnement.

```javascript
const {
  formatBytes,
  parseSizeStr,
  estimateRowSize,
  estimateTableSize,
  estimateDbSize,
  dirSize,
} = require('@idirdev/dbsize');

// Format raw bytes to human-readable string
// Formater des octets bruts en chaîne lisible
console.log(formatBytes(1572864)); // '1.50 MB'

// Parse a size string back to bytes
// Convertir une chaîne de taille en octets
console.log(parseSizeStr('2.5 GB')); // 2684354560

// Estimate the size of one row from a column schema
// Estimer la taille d'une ligne à partir d'un schéma de colonnes
const cols = [
  { type: 'uuid' },
  { type: 'varchar(255)' },
  { type: 'text' },
  { type: 'timestamp' },
  { type: 'bool' },
];
console.log(estimateRowSize(cols)); // ~546 bytes

// Estimate full table size (data + index overhead)
// Estimer la taille complète d'une table (données + index)
const table = estimateTableSize(cols, 100000);
console.log(table);
// { rowSize: 546, dataSize: 54600000, indexOverhead: 16380000, total: 70980000 }
console.log(formatBytes(table.total)); // '67.70 MB'

// Estimate entire database size
// Estimer la taille complète d'une base de données
const db = estimateDbSize([
  { name: 'users',  columns: cols, rowCount: 50000 },
  { name: 'posts',  columns: [{ type: 'uuid' }, { type: 'text' }, { type: 'timestamp' }], rowCount: 200000 },
]);
console.log(formatBytes(db.total)); // '83.42 MB'

// Get directory size in bytes
// Obtenir la taille d'un répertoire en octets
const bytes = dirSize('/var/log');
console.log(formatBytes(bytes)); // '215.00 MB'
```

### API Reference

| Function | Parameters | Returns |
|----------|-----------|---------|
| `formatBytes(bytes)` | number | `string` |
| `parseSizeStr(s)` | size string | `number` |
| `estimateRowSize(columns)` | array of `{type}` | `number` (bytes) |
| `estimateTableSize(columns, rowCount)` | columns, row count | `{rowSize, dataSize, indexOverhead, total}` |
| `estimateDbSize(tables)` | array of `{name, columns, rowCount}` | `{total, tables[]}` |
| `dirSize(dir)` | path | `number` (bytes) |

---

## License

MIT - idirdev
