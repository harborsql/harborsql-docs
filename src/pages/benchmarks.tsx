import Layout from '@theme/Layout';
import styles from './benchmarks.module.css';

export default function Benchmarks() {
  return (
    <Layout
      title="HarborSQL vs Databricks SQL Benchmarks"
      description="Compare HarborSQL and Databricks SQL Warehouse performance, compute cost, hardware, datasets, methodology, and reproducible benchmark results.">
      <main className={styles.page}>
        <article className={styles.summary}>
          <header className={styles.header}>
            <p className={styles.kicker}>Reproducible performance results</p>
            <h1>HarborSQL vs Databricks SQL benchmarks</h1>
            <p className={styles.lede}>
              HarborSQL benchmarks measure client-observed query time and
              modeled compute cost across ClickBench, point lookups, SSB, and
              Delta type compatibility. The raw results, runners, and cost
              assumptions are public so you can inspect every claim.
            </p>
          </header>

          <section aria-labelledby="latest-clickbench">
            <h2 id="latest-clickbench">Latest ClickBench result</h2>
            <p>
              HarborSQL v0.1.9 on an AWS <code>c8i.2xlarge</code> completed the
              43-query optimized ClickBench suite with a 91.351-second best
              total. The published Databricks 2X-Small baselines completed in
              165.7 seconds with Cloud Fetch and 170.3 seconds without it.
            </p>
            <p>
              On this benchmark, HarborSQL used 44.9% to 46.4% less client time
              on the best-total measure. Its modeled server compute cost was
              $0.0113, compared with $0.1657 to $0.1703 for the Databricks
              baselines. These numbers describe this dataset and topology, not
              every production query.
            </p>

            <div className={styles.tableWrap}>
              <table>
                <caption>Optimized ClickBench table, 43 queries and three runs per query</caption>
                <thead>
                  <tr>
                    <th scope="col">System</th>
                    <th scope="col">Compute</th>
                    <th scope="col">Best total</th>
                    <th scope="col">Median total</th>
                    <th scope="col">Modeled best cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">HarborSQL v0.1.9</th>
                    <td>AWS c8i.2xlarge</td>
                    <td>91.351s</td>
                    <td>92.852s</td>
                    <td>$0.0113</td>
                  </tr>
                  <tr>
                    <th scope="row">Databricks v2026.10</th>
                    <td>2X-Small SQL Warehouse</td>
                    <td>170.3s</td>
                    <td>192.1s</td>
                    <td>$0.1703</td>
                  </tr>
                  <tr>
                    <th scope="row">Databricks v2026.10 with Cloud Fetch</th>
                    <td>2X-Small SQL Warehouse</td>
                    <td>165.7s</td>
                    <td>179.5s</td>
                    <td>$0.1657</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div className={styles.detailsGrid}>
            <section aria-labelledby="methodology">
              <h2 id="methodology">Methodology and hardware</h2>
              <ul>
                <li>Run the benchmark client in the same cloud region as the data.</li>
                <li>Measure wall-clock time observed by the client.</li>
                <li>Execute each ClickBench query three times.</li>
                <li>Compare an AWS c8i.2xlarge HarborSQL host with a managed Databricks 2X-Small SQL Warehouse.</li>
                <li>Use an AWS t3.small benchmark client for the published comparison.</li>
              </ul>
            </section>

            <section aria-labelledby="datasets">
              <h2 id="datasets">Published datasets</h2>
              <ul>
                <li><strong>ClickBench:</strong> 43 analytical queries over an optimized S3-backed hits table.</li>
                <li><strong>Point lookup:</strong> concurrent lookups against the ClickBench table.</li>
                <li><strong>SSB SF10:</strong> a star-schema decision-support workload.</li>
                <li><strong>Delta types:</strong> result compatibility across common Delta and Arrow types.</li>
              </ul>
            </section>
          </div>

          <section aria-labelledby="limitations">
            <h2 id="limitations">How to read these results</h2>
            <p>
              Best total sums the fastest observed run for each query. Median
              and average totals show how repeat runs behaved. Cost figures use
              server or warehouse compute only and exclude the benchmark client,
              storage, network transfer, monitoring, support, taxes, idle time,
              and the labor required to operate HarborSQL.
            </p>
            <p>
              HarborSQL is a single-engine, read-only runtime. Databricks SQL
              Warehouse includes managed scaling and a broader SQL and result
              delivery surface. Benchmark your own query mix, concurrency, data
              layout, and cloud region before making a production decision.
            </p>
          </section>

          <section aria-labelledby="reproduce">
            <h2 id="reproduce">Inspect and reproduce the benchmark</h2>
            <ul className={styles.linkList}>
              <li><a href="https://github.com/harborsql/harborsql-bench">Benchmark source repository</a></li>
              <li><a href="https://github.com/harborsql/harborsql-bench/blob/main/results/harborsql/c8i.2xlarge/v0.1.9/clickbench/optimized.json">HarborSQL v0.1.9 ClickBench result</a></li>
              <li><a href="https://github.com/harborsql/harborsql-bench/blob/main/results/databricks-sql-warehouse/2xs/v2026.10/clickbench/databricks-2xs-aws-ec2-t3.small-clickbench-20260510T152626Z.json">Databricks 2X-Small ClickBench result</a></li>
              <li><a href="https://github.com/harborsql/harborsql-bench/tree/main/datasets/clickbench">ClickBench queries and dataset notes</a></li>
              <li><a href="https://github.com/harborsql/harborsql-bench/blob/main/docs/benchmark-instance-costs.md">Compute pricing assumptions</a></li>
            </ul>
          </section>
        </article>

        <section className={styles.dashboard} aria-labelledby="dashboard-title">
          <div className={styles.dashboardHeading}>
            <h2 id="dashboard-title">Explore every published result</h2>
            <p>Compare releases, datasets, individual queries, latency, failures, and cost estimates.</p>
          </div>
          <iframe
            className={styles.frame}
            src="/benchmark-dashboard/"
            title="Interactive HarborSQL benchmark dashboard"
          />
        </section>
      </main>
    </Layout>
  );
}
