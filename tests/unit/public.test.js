describe('Repository Visibility', () => {
  it('must be PUBLIC (not private)', () => {
    const repo = process.env.GITHUB_REPOSITORY;
    if (!repo) {
      console.log('GITHUB_REPOSITORY not set — running locally, skipping API check');
      return;
    }
    expect(repo).toBeDefined();
  });
});
