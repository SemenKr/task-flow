import {devices, test} from 'playwright/test';

test.use({browserName: 'chromium'})

const DEMO_URL = 'https://task-flow-samkr.vercel.app'
const DEMO_EMAIL = 'free@samuraijs.com'
const DEMO_PASSWORD = 'free'

const login = async (page: import('playwright/test').Page) => {
    await page.goto(`${DEMO_URL}/login`, {waitUntil: 'networkidle'})

    if (page.url().endsWith('/login')) {
        await page.locator('#email').fill(DEMO_EMAIL)
        await page.locator('#password').fill(DEMO_PASSWORD)
        await page.getByRole('button', {name: 'Enter dashboard'}).click()
    }

    await page.waitForURL((url) => !url.pathname.endsWith('/login'), {timeout: 20_000})
    await page.getByText('Your task boards').waitFor({timeout: 20_000})
}

test('capture login screenshot', async ({page}) => {
    await page.goto(`${DEMO_URL}/login`, {waitUntil: 'networkidle'})
    await page.screenshot({
        path: 'docs/screenshots/login.png',
        fullPage: true,
    })
})

test('capture dashboard screenshot', async ({page}) => {
    await login(page)
    await page.screenshot({
        path: 'docs/screenshots/dashboard.png',
        fullPage: true,
    })
})

test.use({
    ...devices['iPhone 13'],
})

test('capture mobile sidebar screenshot', async ({page}) => {
    await login(page)
    await page.getByRole('button', {name: /Analytics/i}).click()
    await page.getByRole('button', {name: /Navigate/i}).click()

    await page.screenshot({
        path: 'docs/screenshots/mobile-sidebar.png',
        fullPage: true,
    })
})
