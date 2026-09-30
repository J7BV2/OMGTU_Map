import defaultPois from '../data/pois.json';

export interface POI {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
}

export interface OmgtuSearchItem {
  id: number;
  label: string;
  description: string;
  type: 'group' | 'person' | 'auditorium'
}
export type OmgtuSearchType = 'group' | 'person' | 'auditorium';

// Before const OMGTU_API_BASE_URL = 'https://rasp.omgtu.ru/api';
// Now
const OMGTU_API_BASE_URL = '/omgtu-api';

// Имитация базы данных через localStorage, чтобы данные сохранялись при перезагрузке
const getDb = (): POI[] => {
  const stored = localStorage.getItem('unimap_pois_db');
  if (!stored) {
    localStorage.setItem('unimap_pois_db', JSON.stringify(defaultPois));
    return defaultPois as POI[];
  }
  try {
    return JSON.parse(stored) as POI[];
  } catch (e) {
    return defaultPois as POI[];
  }
};

export const api = {
  // Поиск точек (имитация сетевой задержки)
  searchPois: async (query: string = ''): Promise<POI[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getDb();
        const q = query.toLowerCase();
        const results = db.filter(
          (p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
        );
        resolve(results);
      }, 300); // 300ms задержка для реалистичности
    });
  },

  /**
   * Универсальный поиск по API ОмГТУ.
   * @param term - поисковый запрос (например, "Д-23")
   * @param type - что ищем: group | lecturer | auditorium
   */
  searchOmgtu: async (
    term: string,
    type: OmgtuSearchType
  ): Promise<OmgtuSearchItem[]> => {
    if (!term || term.trim().length < 1) return [];

      try {
        const params = new URLSearchParams({
        term,
        type,
        });

        const url = `${OMGTU_API_BASE_URL}/search?${params.toString()}`;
        // получится: /omgtu-api/search?term=...&type=group

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API вернул статус ${response.status}`);
        }

        const data: OmgtuSearchItem[] = await response.json();
        return data;
      } catch (error) {
      console.error(`Ошибка поиска (${type}):`, error);
      return [];
      }
  },
};