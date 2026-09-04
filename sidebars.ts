import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'databricks-sql-warehouse-alternative',
    'databricks-sql-warehouse-pricing',
    {
      type: 'category',
      label: 'Articles',
      link: {
        type: 'doc',
        id: 'articles/index',
      },
      items: [
        'articles/databricks-alternatives-sql-analytics',
        'articles/why-i-built-harborsql',
        'articles/building-databricks-sql-compatible-server',
      ],
    },
    'getting-started',
    'databricks-jdbc',
    'docker',
    'how-it-works',
    'configuration',
    'advanced-usage',
    'result-types',
    'delta-types-compatibility',
    'sql-compatibility',
    'show-statements',
    'system-metadata',
  ],
};

export default sidebars;
