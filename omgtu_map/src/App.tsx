import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Center, Text, Html } from '@react-three/drei';
import { Search, Globe, Moon, Sun, Map as MapIcon, Loader2, Plus, MapPin } from 'lucide-react';
import { api, type POI } from './lib/api';


function MapPlaceholder({ pois }: { pois: POI[] }) {
  return (
    <group>
      <Center position={[0, 0.5, 0]}>
        <Text
          color="gray"
          fontSize={1}
          maxWidth={200}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="center"
          position={[0, 2, 0]}
          rotation={[-Math.PI / 4, 0, 0]}
        >
          3D MAP PLACEHOLDER
        </Text>
      </Center>
      
      {/* Mock Buildings (Base Architecture) */}
      <mesh position={[-2, 1, -2]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#888" roughness={0.2} metalness={0.8} transparent opacity={0.8} />
      </mesh>
      <mesh position={[3, 1.5, -1]}>
        <boxGeometry args={[3, 3, 2]} />
        <meshStandardMaterial color="#666" roughness={0.2} metalness={0.8} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 3]}>
        <boxGeometry args={[4, 1, 3]} />
        <meshStandardMaterial color="#999" roughness={0.2} metalness={0.8} transparent opacity={0.8} />
      </mesh>

      {/* Visual Markers for POIs from Database */}
      {pois.map((poi) => (
        <group key={poi.id} position={poi.position}>
          {/* 3D Pin */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          
          {/* Liquid Glass Label */}
          <Html center position={[0, 0.6, 0]} className="pointer-events-none z-10">
            <div className="liquid-glass px-3 py-1.5 rounded-lg flex flex-col items-center justify-center whitespace-nowrap">
              <span className="text-xs font-semibold text-foreground uppercase tracking-widest">{poi.name}</span>
            </div>
          </Html>
        </group>
      ))}

      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5} 
        sectionColor="#444" 
        cellColor="#222" 
      />
    </group>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);
  
  // API State
  const [searchQuery, setSearchQuery] = useState('');
  const [pois, setPois] = useState<POI[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New POI Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Custom');

  useEffect(() => {
    if (darkTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkTheme]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Debounced Search API Call
  useEffect(() => {
    const handler = setTimeout(async () => {
      setIsSearching(true);
      const results = await api.searchPois(searchQuery);
      setPois(results);
      setIsSearching(false);
    }, 400); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const toggleTheme = () => setDarkTheme((prev) => !prev);

  const handleAddPoi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setIsAdding(true);
    // Сгенерируем случайную позицию рядом с центром для демонстрации
    const randomPos: [number, number, number] = [
      (Math.random() - 0.5) * 10,
      1.5,
      (Math.random() - 0.5) * 10
    ];

    await api.addPoi({
      name: newName,
      type: newType,
      position: randomPos
    });

    // Refresh current search results
    const results = await api.searchPois(searchQuery);
    setPois(results);
    
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans">
      {/* Loading Screen Overlay */}
      <div 
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-700 pointer-events-none ${loading ? 'opacity-100' : 'opacity-0'}`}
      >
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-foreground" />
        <h1 className="text-2xl font-bold tracking-[0.2em] text-foreground">INITIALIZING</h1>
        <p className="text-sm tracking-widest uppercase mt-2 text-gray-500">OMGTU Map</p>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [12, 12, 12], fov: 45 }}>
          <color attach="background" args={[darkTheme ? '#000' : '#f4f4f5']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Suspense fallback={null}>
            <MapPlaceholder pois={pois} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        </Canvas>
      </div>

      {/* Header */}
      <header className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 liquid-glass px-5 py-3 rounded-2xl pointer-events-auto">
          <MapIcon className="w-5 h-5 text-foreground" />
          <span className="font-semibold tracking-wide uppercase text-sm">OmGTU 3D</span>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            className="liquid-glass p-3 rounded-full hover:bg-glass/80 transition-colors"
            title="Switch Language"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleTheme}
            className="liquid-glass p-3 rounded-full hover:bg-glass/80 transition-colors"
            title="Toggle Theme"
          >
            {darkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="absolute left-6 top-24 bottom-6 w-80 z-10 flex flex-col liquid-glass rounded-3xl overflow-hidden pointer-events-auto transition-transform duration-500" style={{ transform: loading ? 'translateX(-120%)' : 'translateX(0)' }}>
        <div className="p-6 border-b border-glass-border">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Points of Interest</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search via API..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-glass-border rounded-xl py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow placeholder:text-gray-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {pois.length > 0 ? (
            pois.map((poi) => (
              <button 
                key={poi.id}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group flex flex-col gap-1 border border-transparent hover:border-glass-border"
              >
                <span className="font-medium text-sm text-foreground flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {poi.name}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wider pl-5">{poi.type}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              {isSearching ? 'Searching database...' : 'No locations found'}
            </div>
          )}
        </div>

        {/* Add POI Form (Database Mock) */}
        <div className="p-4 border-t border-glass-border bg-black/5 dark:bg-white/5">
          <form onSubmit={handleAddPoi} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="New location name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-transparent border border-glass-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow placeholder:text-gray-500"
              required
            />
            <button 
              type="submit" 
              disabled={isAdding || !newName.trim()}
              className="flex items-center justify-center gap-2 bg-foreground text-background py-2 rounded-lg text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isAdding ? 'Adding to DB...' : 'Add Marker'}
            </button>
          </form>
        </div>
      </aside>

      {/* Optional Custom Scrollbar Styles embedded */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--glass-border);
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}