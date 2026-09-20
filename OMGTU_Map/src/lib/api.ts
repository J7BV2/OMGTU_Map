import defaultPois from '../data/pois.json';

export interface POI {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
}

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

  // Добавление новой точки на карту
  addPoi: async (poi: Omit<POI, 'id'>): Promise<POI> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getDb();
        const newPoi: POI = {
          ...poi,
          id: Math.random().toString(36).substring(2, 9), // Генерация ID
        };
        db.push(newPoi);
        localStorage.setItem('unimap_pois_db', JSON.stringify(db));
        resolve(newPoi);
      }, 400);
    });
  },
};
