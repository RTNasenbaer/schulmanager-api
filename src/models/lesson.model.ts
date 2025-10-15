/**
 * Lesson Model
 * Repräsentiert eine einzelne Schulstunde
 */

export interface Lesson {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  lessonNumber: number;
  date: string;
  isSubstitution: boolean;
  isCancelled: boolean;
}

/**
 * Lesson-Klasse mit Hilfsmethoden
 */
export class LessonModel implements Lesson {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  lessonNumber: number;
  date: string;
  isSubstitution: boolean;
  isCancelled: boolean;

  constructor(data: Lesson) {
    this.id = data.id;
    this.subject = data.subject;
    this.teacher = data.teacher;
    this.room = data.room;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.lessonNumber = data.lessonNumber;
    this.date = data.date;
    this.isSubstitution = data.isSubstitution;
    this.isCancelled = data.isCancelled;
  }

  /**
   * Erstellt eine Lesson aus rohen Schulmanager-Daten
   */
  static fromScrapedData(data: any): LessonModel {
    // TODO: Implementierung basierend auf Schulmanager HTML-Struktur
    return new LessonModel({
      id: data.id || `${data.date}-${data.lessonNumber}`,
      subject: data.subject || 'Unbekannt',
      teacher: data.teacher || 'N/A',
      room: data.room || 'N/A',
      startTime: data.startTime || '00:00',
      endTime: data.endTime || '00:00',
      lessonNumber: data.lessonNumber || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      isSubstitution: data.isSubstitution || false,
      isCancelled: data.isCancelled || false,
    });
  }

  /**
   * Formatiert die Lesson für Alexa Voice-Output
   */
  toAlexaFormat(): string {
    if (this.isCancelled) {
      return `${this.subject} in der ${this.lessonNumber}. Stunde fällt aus`;
    }

    let output = `Um ${this.startTime} Uhr ${this.subject}`;
    
    if (this.isSubstitution) {
      output += ` mit Vertretung bei ${this.teacher}`;
    } else {
      output += ` bei ${this.teacher}`;
    }
    
    if (this.room && this.room !== 'N/A') {
      output += ` in Raum ${this.room}`;
    }

    return output;
  }

  /**
   * Prüft ob die Lesson in der Zukunft liegt
   */
  isUpcoming(): boolean {
    const now = new Date();
    const lessonDateTime = new Date(`${this.date}T${this.startTime}`);
    return lessonDateTime > now;
  }

  /**
   * Prüft ob die Lesson gerade läuft
   */
  isCurrentlyActive(): boolean {
    const now = new Date();
    const start = new Date(`${this.date}T${this.startTime}`);
    const end = new Date(`${this.date}T${this.endTime}`);
    return now >= start && now <= end;
  }
}
