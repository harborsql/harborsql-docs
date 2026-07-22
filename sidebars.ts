import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'databricks-sql-warehouse-alternative',
    {
      type: 'category',
      label: 'Articles',
      link: {
        type: 'generated-index',
        title: 'Articles',
        description: 'Long-form notes about HarborSQL design, benchmarks, and trade-offs.',
      },
      items: [
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
