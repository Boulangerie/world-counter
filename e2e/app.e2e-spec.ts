import { WorldCounterPage } from './app.po';

describe('world-counter App', function() {
  let page: WorldCounterPage;

  beforeEach(() => {
    page = new WorldCounterPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
