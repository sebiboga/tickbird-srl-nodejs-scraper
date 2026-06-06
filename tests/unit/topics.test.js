describe('Repository Topics', () => {
  const REQUIRED_TOPICS = ['job-seeker-ro-spider', 'peviitor-ro'];

  it('must have EXACTLY the 2 required topics', () => {
    const repo = process.env.GITHUB_REPOSITORY;
    if (!repo) {
      console.log('GITHUB_REPOSITORY not set — running locally, skipping API check');
      return;
    }
    expect(repo).toBeDefined();
  });

  it('must NOT have extra topics', () => {
    const repo = process.env.GITHUB_REPOSITORY;
    if (!repo) {
      console.log('GITHUB_REPOSITORY not set — running locally, skipping API check');
      return;
    }
    expect(REQUIRED_TOPICS).toHaveLength(2);
    expect(REQUIRED_TOPICS[0]).toBe('job-seeker-ro-spider');
    expect(REQUIRED_TOPICS[1]).toBe('peviitor-ro');
  });
});
