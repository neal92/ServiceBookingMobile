import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formater une date selon le format spécifié
 * @param date - Date à formater (string ISO ou Date)
 * @param formatString - Format de sortie (par défaut: 'dd/MM/yyyy')
 * @returns Date formatée
 */
export const formatDate = (date: Date | string, formatString: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: fr });
};

/**
 * Extraire l'heure d'une date
 * @param date - Date à formater (string ISO ou Date)
 * @returns Heure formatée (HH:mm)
 */
export const formatTime = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm', { locale: fr });
};

/**
 * Formater une date en format relatif (aujourd'hui, hier, etc.)
 * @param date - Date à formater (string ISO ou Date)
 * @returns Date formatée en format relatif
 */
export const formatRelativeDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  
  // Si c'est aujourd'hui
  if (isSameDay(dateObj, now)) {
    return `Aujourd'hui à ${format(dateObj, 'HH:mm')}`;
  }
  
  // Si c'est hier
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(dateObj, yesterday)) {
    return `Hier à ${format(dateObj, 'HH:mm')}`;
  }
  
  // Si c'est demain
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  if (isSameDay(dateObj, tomorrow)) {
    return `Demain à ${format(dateObj, 'HH:mm')}`;
  }
  
  // Sinon, format complet
  return format(dateObj, 'dd MMMM yyyy à HH:mm', { locale: fr });
};

/**
 * Vérifier si deux dates sont le même jour
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns true si même jour, false sinon
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Formater une date avec une heure optionnelle
 * @param date - Date à formater (string ISO ou Date)
 * @param time - Heure séparée au format HH:mm (optionnel)
 * @returns Date et heure formatées
 */
export const formatDateWithTime = (date: Date | string, time?: string): string => {
  if (!date) return '';
  
  const formattedDate = formatDate(date);
  
  if (time) {
    return `${formattedDate} à ${time}`;
  }
  
  // Essayer d'extraire l'heure de la date
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isNaN(dateObj.getTime()) && dateObj.getHours() !== 0) {
    return `${formattedDate} à ${formatTime(date)}`;
  }
  
  // Si pas d'heure disponible, retourner seulement la date
  return formattedDate;
};
