import Layout from '@theme/Layout';
import styles from './benchmarks.module.css';

export default function Benchmarks() {
  return (
    <Layout
      title="Benchmarks"
      description="HarborSQL benchmark results across datasets and releases">
      <main className={styles.page}>
        <iframe
          className={styles.frame}
          src="/benchmark-dashboard/"
          title="HarborSQL benchmark dashboard"
        />
      </main>
    </Layout>
  );
}
