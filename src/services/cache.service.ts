/**
 * Cache Service
 * In-Memory-Caching für Performance-Optimierung
 */

import NodeCache from 'node-cache';
import { config } from '../config/config';

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600, // Default: 10 Minuten
      checkperiod: 120, // Prüfe alle 2 Minuten auf abgelaufene Keys
      useClones: false, // Performance-Optimierung
    });
  }

  /**
   * Setzt einen Wert im Cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || config.cache.ttl.timetable);
  }

  /**
   * Holt einen Wert aus dem Cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Prüft ob ein Key existiert
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Löscht einen Key aus dem Cache
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Löscht alle Keys mit einem bestimmten Prefix
   */
  delByPrefix(prefix: string): number {
    const keys = this.cache.keys().filter(key => key.startsWith(prefix));
    return this.cache.del(keys);
  }

  /**
   * Löscht den gesamten Cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Gibt Cache-Statistiken zurück
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Holt oder erstellt einen Cache-Eintrag
   * Wenn der Key nicht existiert, wird die Funktion ausgeführt und das Ergebnis gecacht
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      console.log(`Cache HIT: ${key}`);
      return cached;
    }

    console.log(`Cache MISS: ${key}`);
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Generiert einen Cache-Key für Stundenplan
   */
  getTimetableKey(userId: string, date: string): string {
    return `timetable:${userId}:${date}`;
  }

  /**
   * Generiert einen Cache-Key für Vertretungsplan
   */
  getSubstitutionsKey(userId: string, date: string): string {
    return `substitutions:${userId}:${date}`;
  }

  /**
   * Generiert einen Cache-Key für User-Daten
   */
  getUserDataKey(userId: string): string {
    return `user:${userId}`;
  }
}

// Singleton-Instance
export const cacheService = new CacheService();
