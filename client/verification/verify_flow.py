from playwright.sync_api import sync_playwright

def verify_app_flow():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("1. Opening Login Page...")
        page.goto("http://localhost:5173/login")

        # Login
        print("2. Attempting Login...")
        page.fill('input[type="text"]', 'rlucena')
        page.fill('input[type="password"]', 'Gilb3rt01+')
        page.click('button[type="submit"]')

        # Wait for navigation to Dashboard
        page.wait_for_url('http://localhost:5173/')
        print("3. Login Successful. Dashboard reached.")

        # Navigate to Sessions
        print("4. Navigating to Sessions...")
        page.click('a[href="/sessions"]')

        # Verify Session List Loaded
        page.wait_for_selector('h2:has-text("Sesiones")')
        print("5. Sessions page loaded.")

        # Take Screenshot
        page.screenshot(path="client/verification/verification_flow.png")
        print("6. Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_app_flow()
