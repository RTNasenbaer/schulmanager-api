/**
 * Substitution Model
 * Repräsentiert einen Vertretungsplan-Eintrag
 */

export enum SubstitutionType {
  SUBSTITUTION = 'substitution',
  CANCELLATION = 'cancellation',
  ROOM_CHANGE = 'room_change',
  TIME_CHANGE = 'time_change',
  OTHER = 'other'
}

export interface Substitution {
  id: string;
  date: string;
  lessonNumber: number;
  originalSubject: string;
  originalTeacher: string;
  substituteSubject?: string;
  substituteTeacher?: string;
  room?: string;
  isCancelled: boolean;
  note?: string;
  type: SubstitutionType;
}

/**
 * Substitution-Klasse mit Hilfsmethoden
 */
export class SubstitutionModel implements Substitution {
  id: string;
  date: string;
  lessonNumber: number;
  originalSubject: string;
  originalTeacher: string;
  substituteSubject?: string;
  substituteTeacher?: string;
  room?: string;
  isCancelled: boolean;
  note?: string;
  type: SubstitutionType;

  constructor(data: Substitution) {
    this.id = data.id;
    this.date = data.date;
    this.lessonNumber = data.lessonNumber;
    this.originalSubject = data.originalSubject;
    this.originalTeacher = data.originalTeacher;
    this.substituteSubject = data.substituteSubject;
    this.substituteTeacher = data.substituteTeacher;
    this.room = data.room;
    this.isCancelled = data.isCancelled;
    this.note = data.note;
    this.type = data.type;
  }

  /**
   * Erstellt eine Substitution aus rohen Schulmanager-Daten
   */
  static fromScrapedData(data: any): SubstitutionModel {
    // TODO: Implementierung basierend auf Schulmanager HTML-Struktur
    
    // Determine substitution type
    let type = SubstitutionType.OTHER;
    if (data.isCancelled || data.note?.toLowerCase().includes('fällt aus')) {
      type = SubstitutionType.CANCELLATION;
    } else if (data.substituteTeacher || data.substituteSubject) {
      type = SubstitutionType.SUBSTITUTION;
    } else if (data.room && data.room !== data.originalRoom) {
      type = SubstitutionType.ROOM_CHANGE;
    }

    return new SubstitutionModel({
      id: data.id || `${data.date}-${data.lessonNumber}`,
      date: data.date || new Date().toISOString().split('T')[0],
      lessonNumber: data.lessonNumber || 0,
      originalSubject: data.originalSubject || 'Unbekannt',
      originalTeacher: data.originalTeacher || 'N/A',
      substituteSubject: data.substituteSubject,
      substituteTeacher: data.substituteTeacher,
      room: data.room,
      isCancelled: data.isCancelled || false,
      note: data.note,
      type,
    });
  }

  /**
   * Formatiert die Substitution für Alexa Voice-Output
   */
  toAlexaFormat(): string {
    switch (this.type) {
      case SubstitutionType.CANCELLATION:
        return `${this.originalSubject} in der ${this.lessonNumber}. Stunde fällt aus`;
      
      case SubstitutionType.SUBSTITUTION:
        let output = `${this.originalSubject} in der ${this.lessonNumber}. Stunde`;
        if (this.substituteTeacher) {
          output += ` wird von ${this.substituteTeacher} vertreten`;
        }
        if (this.substituteSubject && this.substituteSubject !== this.originalSubject) {
          output += ` mit ${this.substituteSubject}`;
        }
        return output;
      
      case SubstitutionType.ROOM_CHANGE:
        return `${this.originalSubject} in der ${this.lessonNumber}. Stunde ist in Raum ${this.room}`;
      
      default:
        return `${this.originalSubject} in der ${this.lessonNumber}. Stunde: ${this.note || 'Änderung'}`;
    }
  }

  /**
   * Prüft ob die Substitution heute ist
   */
  isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  /**
   * Prüft ob die Substitution in der Zukunft liegt
   */
  isUpcoming(): boolean {
    const now = new Date();
    const substitutionDate = new Date(this.date);
    return substitutionDate >= now;
  }
}
