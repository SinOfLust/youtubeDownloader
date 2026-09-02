/* eslint jest/expect-expect: off, jest/no-test-callback: off */
import { ClientFunction, Selector } from 'testcafe';

const getPageTitle = ClientFunction(() => document.title);
const assertNoConsoleErrors = async (t: TestController) => {
  const { error } = await t.getBrowserConsoleMessages();
  await t.expect(error).eql([]);
};

fixture`Home Page`.page('../../app/app.html').afterEach(assertNoConsoleErrors);

test('should have the expected window title', async t => {
  await t.expect(getPageTitle()).eql('Youtube Downloader');
});

test('should render the URL input and download button', async t => {
  await t
    .expect(Selector('input[type="text"]').exists)
    .ok()
    .expect(Selector('#submit').exists)
    .ok();
});

test('should show an error when downloading without a URL', async t => {
  await t
    .click('#submit')
    .expect(Selector('.errorMessage').innerText)
    .contains('URL');
});
