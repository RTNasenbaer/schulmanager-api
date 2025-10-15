/**
 * Schulmanager Service
 * Hauptservice für Web-Scraping von Schulmanager-Online.de
 * 
 * Implementiert vollständiges Login und Scraping der Stundenpläne
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from '../config/config';
import { LessonModel } from '../models/lesson.model';
import { SubstitutionModel } from '../models/substitution.model';

interface ScrapedLesson {
  hour: number;
  class: string;
  teacher: string;
  room: string;
  isSubstitution: boolean;
  isCancelled: boolean;
  substitutionInfo?: string;
}

type WeekSchedule = Record<string, ScrapedLesson[]>;

export class SchulmanagerService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn: boolean = false;
  private loginPromise: Promise<boolean> | null = null;

  /**
   * Check if currently logged in
   */
  public isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  /**
   * Initialisiert den Browser
   */
  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: config.server.isProduction,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
      });
      this.page = await this.browser.newPage();
    }
  }

  /**
   * Meldet sich bei Schulmanager an (with concurrency protection)
   */
  async login(username: string, password: string): Promise<boolean> {
    // If already logged in, return true
    if (this.isLoggedIn) {
      return true;
    }

    // If a login is already in progress, wait for it
    if (this.loginPromise) {
      return await this.loginPromise;
    }

    // Start new login process
    this.loginPromise = this.performLogin(username, password);
    
    try {
      const result = await this.loginPromise;
      return result;
    } finally {
      this.loginPromise = null;
    }
  }

  /**
   * Performs the actual login process
   */
  private async performLogin(username: string, password: string): Promise<boolean> {
    try {
      await this.init();

      if (!this.page) {
        throw new Error('Browser page not initialized');
      }

      console.log('🔐 Logging into Schulmanager...');
      
      // Navigate to login page and wait for it to load
      await this.page.goto('https://login.schulmanager-online.de/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for the page to be ready
      await this.page.waitForTimeout(2000);
      
      // Wait for and find the email input (try multiple selectors)
      let emailInput = await this.page.$('.login-form input[type="text"]');
      if (!emailInput) {
        emailInput = await this.page.$('input[type="email"]');
      }
      if (!emailInput) {
        emailInput = await this.page.$('input[name="email"]');
      }
      
      if (!emailInput) {
        throw new Error('Could not find email input field');
      }
      
      // Type email
      await emailInput.type(username);
      
      // Wait for and type password
      const passwordInput = await this.page.$('input[type="password"]');
      if (!passwordInput) {
        throw new Error('Could not find password input field');
      }
      await passwordInput.type(password);
      
      // Find and click submit button
      const submitButton = await this.page.$('.login-form button');
      if (!submitButton) {
        throw new Error('Could not find submit button');
      }
      
      // Click and wait for navigation
      await Promise.all([
        submitButton.click(),
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {
          console.log('⚠️  Navigation timeout, but continuing...');
        })
      ]);
      
      // Wait for dashboard to load
      await this.page.waitForTimeout(3000);
      
      // Check if login was successful by checking URL
      const currentUrl = this.page.url();
      this.isLoggedIn = currentUrl.includes('schulmanager-online.de/#/');
      
      if (this.isLoggedIn) {
        console.log('✅ Login successful');
      } else {
        console.log('❌ Login failed - not redirected to dashboard');
      }

      return this.isLoggedIn;
    } catch (error) {
      console.error('❌ Login failed:', error);
      this.isLoggedIn = false;
      return false;
    }
  }

  /**
   * Get Monday of the week for a given date
   */
  private getMondayOfWeek(date: Date): string {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }

  /**
   * Holt den kompletten Wochenstundenplan
   */
  async getWeekSchedule(date?: Date): Promise<WeekSchedule> {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Not logged in to Schulmanager');
    }

    try {
      console.log('📅 Fetching week schedule...');
      
      // Get Monday of the week (Schulmanager requires Monday date in URL)
      const targetDate = date || new Date();
      const mondayDate = this.getMondayOfWeek(new Date(targetDate));
      
      console.log(`📅 Using Monday date: ${mondayDate}`);
      
      // Navigate to schedule page with the Monday date parameter
      const scheduleUrl = `https://login.schulmanager-online.de/#/modules/schedules/view//?start=${mondayDate}`;
      await this.page.goto(scheduleUrl, { waitUntil: 'domcontentloaded' });
      
      // Wait for Angular to render the schedule (SPA needs time)
      await this.page.waitForTimeout(5000);
      
      // Wait for the schedule table to load
      await this.page.waitForSelector('.calendar-table', { timeout: 10000 });
      
      // Extract the schedule data
      // @ts-ignore - document is available in browser context
      const scheduleData = await this.page.evaluate(() => {
        const table = document.querySelector('.calendar-table');
        const rows = table?.querySelectorAll('tbody tr');
        const schedule: Record<string, Array<{
          hour: number, 
          class: string, 
          teacher: string, 
          room: string,
          isSubstitution: boolean,
          isCancelled: boolean,
          substitutionInfo?: string
        }>> = {};
        
        if (!table || !rows) return schedule;
        
        // Get day headers (Monday to Friday)
        const dayHeaders = table.querySelectorAll('thead th');
        const days: string[] = [];
        for (let i = 1; i < dayHeaders.length; i++) { // Skip first column (hour)
          const dayText = dayHeaders[i].textContent?.trim() || '';
          const dayName = dayText.split('\n')[0].trim();
          days.push(dayName);
        }
        
        // Initialize schedule object
        days.forEach(day => {
          schedule[day] = [];
        });
        
        // Process each row (hour)
        rows.forEach((row: any, hourIndex: number) => {
          const cells = row.querySelectorAll('td');
          const hourNumber = hourIndex + 1;
          
          cells.forEach((cell: any, dayIndex: number) => {
            const lessonCell = cell.querySelector('.lesson-cell');
            
            if (lessonCell) {
              // Extract lesson information
              // Note: Regular lessons have nested span, cancelled lessons have text directly in parent
              const leftElement = lessonCell.querySelector('.timetable-left');
              const className = (leftElement?.querySelector('span')?.textContent || leftElement?.textContent)?.trim() || '';
              
              const rightElement = lessonCell.querySelector('.timetable-right');
              const teacher = (rightElement?.querySelector('span')?.textContent || rightElement?.textContent)?.trim() || '';
              
              const bottomElement = lessonCell.querySelector('.timetable-bottom');
              const room = (bottomElement?.querySelector('span')?.textContent || bottomElement?.textContent)?.trim() || '';
              
              // Check for substitution indicators
              // Substitutions might be marked with special classes or styling
              const hasSubstitutionClass = lessonCell.classList.contains('substitution') || 
                                          lessonCell.classList.contains('changed') ||
                                          lessonCell.classList.contains('cancelled');
              
              // Check if lesson is cancelled (empty or specific marker)
              const isCancelled = lessonCell.classList.contains('cancelled') || 
                                 lessonCell.textContent?.includes('fällt aus') ||
                                 lessonCell.textContent?.includes('entfällt') ||
                                 false;
              
              // Look for substitution text/info
              const substitutionElement = lessonCell.querySelector('.substitution-info, .change-info');
              const substitutionInfo = substitutionElement?.textContent?.trim() || '';
              
              // Detect substitution by checking for changes in teacher or room
              // (This is speculative - needs real data to confirm)
              const isSubstitution = hasSubstitutionClass || 
                                    substitutionInfo.length > 0 ||
                                    lessonCell.querySelector('.text-warning, .text-danger, .badge-warning') !== null;
              
              if (className) {
                const lesson = {
                  hour: hourNumber,
                  class: className,
                  teacher: teacher,
                  room: room,
                  isSubstitution: isSubstitution,
                  isCancelled: isCancelled,
                  substitutionInfo: substitutionInfo || undefined
                };
                
                schedule[days[dayIndex]].push(lesson);
              }
            }
          });
        });
        
        return schedule;
      });
      
      console.log('✅ Week schedule fetched successfully');
      return scheduleData as WeekSchedule;
    } catch (error) {
      console.error('Failed to scrape week schedule:', error);
      throw error;
    }
  }

  /**
   * Holt den Stundenplan für ein bestimmtes Datum
   */
  async getTimetable(date: string): Promise<LessonModel[]> {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in to Schulmanager');
    }

    try {
      console.log(`📖 Fetching timetable for ${date}`);
      
      // Get the full week schedule
      const weekSchedule = await this.getWeekSchedule();
      
      // Parse the date to get day of week
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
      
      // Map German day names to the format used in Schulmanager
      const dayMapping: Record<string, string> = {
        'Montag': 'Mo',
        'Dienstag': 'Di',
        'Mittwoch': 'Mi',
        'Donnerstag': 'Do',
        'Freitag': 'Fr',
      };
      
      const shortDay = dayMapping[dayOfWeek];
      
      // Find the matching day in the schedule
      let daySchedule: ScrapedLesson[] = [];
      for (const [dayKey, lessons] of Object.entries(weekSchedule)) {
        if (dayKey.includes(shortDay)) {
          daySchedule = lessons;
          break;
        }
      }
      
      // Convert to LessonModel objects
      const lessons = daySchedule.map((lesson) => {
        // Calculate approximate times based on lesson number
        // Assuming 45-minute lessons starting at 8:00
        const startHour = 8 + Math.floor((lesson.hour - 1) * 0.75);
        const startMinute = ((lesson.hour - 1) * 45) % 60;
        const endMinute = (startMinute + 45) % 60;
        const endHour = startHour + Math.floor((startMinute + 45) / 60);
        
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        return LessonModel.fromScrapedData({
          subject: lesson.class,
          teacher: lesson.teacher,
          room: lesson.room,
          startTime,
          endTime,
          lessonNumber: lesson.hour,
          date,
          isSubstitution: lesson.isSubstitution,
          isCancelled: lesson.isCancelled,
        });
      });
      
      console.log(`✅ Found ${lessons.length} lessons for ${date}`);
      return lessons;
    } catch (error) {
      console.error('Failed to scrape timetable:', error);
      throw error;
    }
  }

  /**
   * Holt den Vertretungsplan für ein bestimmtes Datum
   * Extrahiert Vertretungen aus dem regulären Stundenplan
   */
  async getSubstitutions(date: string): Promise<SubstitutionModel[]> {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in to Schulmanager');
    }

    try {
      console.log(`📋 Fetching substitutions for ${date}`);
      
      // Get the timetable which now includes substitution information
      const lessons = await this.getTimetable(date);
      
      // Filter for lessons that are substitutions or cancelled
      const substitutions: SubstitutionModel[] = [];
      
      for (const lesson of lessons) {
        if (lesson.isSubstitution || lesson.isCancelled) {
          // Create a substitution entry
          const substitution = SubstitutionModel.fromScrapedData({
            date: lesson.date,
            lessonNumber: lesson.lessonNumber,
            originalSubject: lesson.subject,
            originalTeacher: lesson.isCancelled ? 'Unbekannt' : lesson.teacher,
            substituteTeacher: lesson.isCancelled ? undefined : lesson.teacher,
            substituteSubject: lesson.isCancelled ? undefined : lesson.subject,
            room: lesson.room,
            isCancelled: lesson.isCancelled,
            info: lesson.isCancelled ? 'Stunde fällt aus' : 'Vertretung',
          });
          
          substitutions.push(substitution);
        }
      }
      
      console.log(`✅ Found ${substitutions.length} substitutions for ${date}`);
      return substitutions;
    } catch (error) {
      console.error('Failed to get substitutions:', error);
      throw error;
    }
  }

  /**
   * Prüft ob es heute Vertretungen gibt
   */
  async hasSubstitutionsToday(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const substitutions = await this.getSubstitutions(today);
    return substitutions.length > 0;
  }

  /**
   * Holt nur die ausgefallenen Stunden für ein bestimmtes Datum
   * (ohne Vertretungen, nur Ausfälle)
   */
  async getCancelledClasses(date: string): Promise<LessonModel[]> {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in to Schulmanager');
    }

    try {
      console.log(`❌ Fetching cancelled classes for ${date}`);
      
      // Get the timetable which includes cancellation information
      const lessons = await this.getTimetable(date);
      
      // Filter for only cancelled lessons
      const cancelledLessons = lessons.filter(lesson => lesson.isCancelled);
      
      console.log(`✅ Found ${cancelledLessons.length} cancelled classes for ${date}`);
      return cancelledLessons;
    } catch (error) {
      console.error('Failed to get cancelled classes:', error);
      throw error;
    }
  }

  /**
   * Schließt den Browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }
}

// Singleton-Instance
export const schulmanagerService = new SchulmanagerService();
