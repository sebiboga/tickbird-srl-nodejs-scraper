function itIfSolr(description, testFn, timeout) {
  const solrAuth = process.env.SOLR_AUTH;
  if (!solrAuth) {
    return it.skip(description, testFn, timeout);
  }
  return it(description, testFn, timeout);
}

export { itIfSolr };
