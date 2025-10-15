import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

async function testScraper() {
  console.log('🚀 Starting test scraper...\n');
  
  // Read credentials from .env
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please create it with SCHULMANAGER_EMAIL and SCHULMANAGER_PASSWORD');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const email = envContent.match(/SCHULMANAGER_EMAIL=(.+)/)?.[1]?.trim();
  const password = envContent.match(/SCHULMANAGER_PASSWORD=(.+)/)?.[1]?.trim();
  
  if (!email || !password) {
    console.error('❌ Missing SCHULMANAGER_EMAIL or SCHULMANAGER_PASSWORD in .env');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false, // Show browser so we can see what's happening
    defaultViewport: { width: 1280, height: 800 },
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Step 1: Login
    console.log('📝 Logging in...');
    await page.goto('https://login.schulmanager-online.de/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for page to load and take initial screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, 'login-page.png') });
    console.log('📸 Login page screenshot saved');

    // Try multiple selectors for email input
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="E-Mail"]',
      'input#email',
      '.login-form input[type="text"]',
      'input.email'
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found email input with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Email selector failed: ${selector}`);
      }
    }

    if (!emailInput) {
      console.error('❌ Could not find email input field. Check login-page.png');
      await browser.close();
      return;
    }

    await emailInput.type(email);
    
    // Try multiple selectors for password input
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input#password',
      '.login-form input[type="password"]'
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found password input with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Password selector failed: ${selector}`);
      }
    }

    if (!passwordInput) {
      console.error('❌ Could not find password input field');
      await browser.close();
      return;
    }

    await passwordInput.type(password);

    // Try multiple selectors for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button.login',
      '.login-form button',
      'button:has-text("Anmelden")'
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found submit button with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Submit selector failed: ${selector}`);
      }
    }

    if (!submitButton) {
      console.error('❌ Could not find submit button');
      await browser.close();
      return;
    }

    await Promise.all([
      submitButton.click(),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {
        console.log('⚠️  Navigation timeout, but continuing...');
      })
    ]);
    
    // Wait for dashboard to load
    await page.waitForTimeout(5000);
    console.log('✅ Login completed\n');

    // Step 2: Navigate to schedule with the correct URL format
    console.log('📅 Navigating to schedule page...');
    const scheduleUrl = 'https://login.schulmanager-online.de/#/modules/schedules/view//?start=2025-10-13';
    await page.goto(scheduleUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for the schedule to load (Angular app needs time)
    await page.waitForTimeout(5000);
    console.log('✅ Schedule page loaded\n');

    // Step 3: Save page HTML for analysis
    const htmlContent = await page.content();
    const outputPath = path.join(__dirname, 'schedule-output.html');
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`💾 Saved HTML to: ${outputPath}\n`);

    // Step 4: Analyze the schedule structure
    console.log('🔍 Analyzing schedule structure...\n');
    console.log('=' .repeat(80));

    // Get all day columns
    const days = await page.$$('.timetable-day-column, .day-column, [class*="day"]');
    console.log(`Found ${days.length} day columns\n`);

    // Try to find lessons/entries
    const lessonSelectors = [
      '.timetable-entry',
      '.lesson-entry',
      '.schedule-entry',
      '[class*="entry"]',
      '[class*="lesson"]',
      '.timetable-item',
      '.schedule-item'
    ];

    for (const selector of lessonSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`\n📌 Found ${elements.length} elements with selector: ${selector}`);
        
        // Analyze first few elements
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          console.log(`\n  Element ${i + 1}:`);
          
          const classList = await elements[i].evaluate(el => Array.from(el.classList).join(' '));
          console.log(`  Classes: ${classList}`);
          
          const text = await elements[i].evaluate(el => el.textContent?.trim());
          console.log(`  Text: ${text?.substring(0, 100)}...`);
          
          const html = await elements[i].evaluate(el => el.outerHTML);
          console.log(`  HTML: ${html.substring(0, 200)}...`);
          
          // Check for cancelled/substitution indicators
          const hasCancelledClass = classList.includes('cancelled') || classList.includes('entfällt');
          const hasSubstitutionClass = classList.includes('substitution') || classList.includes('vertretung');
          const textHasCancelled = text?.toLowerCase().includes('fällt aus') || text?.toLowerCase().includes('entfällt');
          
          console.log(`  🔴 Cancelled class: ${hasCancelledClass}`);
          console.log(`  🟡 Substitution class: ${hasSubstitutionClass}`);
          console.log(`  📝 Text mentions cancelled: ${textHasCancelled}`);
        }
      }
    }

    // Step 5: Look for cancelled/substitution specific markers
    console.log('\n\n' + '='.repeat(80));
    console.log('🔍 Searching for cancellation/substitution markers...\n');

    const cancelledMarkers = [
      '.cancelled',
      '.entfällt',
      '.entfaellt',
      '.canceled',
      '[class*="cancel"]',
      '[class*="entf"]',
      '.text-danger',
      '.text-warning',
      '.substitution',
      '.vertretung',
      '[style*="text-decoration: line-through"]',
      '[style*="opacity: 0.5"]'
    ];

    for (const marker of cancelledMarkers) {
      const elements = await page.$$(marker);
      if (elements.length > 0) {
        console.log(`\n✨ Found ${elements.length} elements with marker: ${marker}`);
        
        for (let i = 0; i < Math.min(2, elements.length); i++) {
          const text = await elements[i].evaluate(el => el.textContent?.trim());
          const classes = await elements[i].evaluate(el => Array.from(el.classList).join(' '));
          const html = await elements[i].evaluate(el => el.outerHTML.substring(0, 300));
          
          console.log(`\n  Item ${i + 1}:`);
          console.log(`  Classes: ${classes}`);
          console.log(`  Text: ${text}`);
          console.log(`  HTML: ${html}...`);
        }
      }
    }

    // Step 6: Take a screenshot
    const screenshotPath = path.join(__dirname, 'schedule-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n\n📸 Screenshot saved to: ${screenshotPath}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!\n');
    console.log('📝 Next steps:');
    console.log('1. Check schedule-output.html for the full HTML structure');
    console.log('2. Check schedule-screenshot.png to see the visual layout');
    console.log('3. Look for the classes/markers used for cancelled lessons');
    console.log('4. Update the schulmanager.service.ts based on findings');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testScraper();
