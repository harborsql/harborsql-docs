import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'getting-started',
    'how-it-works',
    'configuration',
    'result-types',
    {
      type: 'category',
      label: 'Operations',
      items: ['operations', 'connector-smoke-tests', 'benchmarks', 'releases', 'security'],
    },
    'development',
  ],
};

export default sidebars;
