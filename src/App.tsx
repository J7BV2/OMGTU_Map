import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Center, Text, Html, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Search, Globe, Moon, Sun, Map as MapIcon, Loader2, Plus, MapPin } from 'lucide-react';
import { api, type POI } from './lib/api';

// Импорт GLB файла из assets
import mapModelUrl from './assets/University/OmGTU_8k_Test.glb';

// Отдельный компонент для 3D-модели карты с безопасной загрузкой
function MapModel() {
    const { scene } = useGLTF(mapModelUrl);

    return <primitive object={ scene } position = { [0, 0, 0]} />;
}

useGLTF.preload(mapModelUrl);
function ModelFallback() {
    return (
        <Html center >
        <div className= "flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-xl text-xs backdrop-blur-md" >
        <Loader2 className="w-4 h-4 animate-spin" />
            <span>Загрузка 3D - карты...</span>
                </div>
                </Html>
  );
}

interface MapPlaceholderProps {
    pois: POI[];
    onSelectPoi?: (poi: POI) => void;
}

function MapPlaceholder({ pois, onSelectPoi }: MapPlaceholderProps) {
    return (
        <group>
        <Center position= { [0, 4, 0]} >
        <Text
          color="gray"
    fontSize = { 1}
    maxWidth = { 200}
    lineHeight = { 1}
    letterSpacing = { 0.02}
    textAlign = "center"
    position = { [0, 2, 0]}
    rotation = { [-Math.PI / 4, 0, 0]}
        >
        OBJ MAP LOADED
            </Text>
            </Center>

    {/* Безопасная загрузка тяжелой 3D модели */ }
    <Suspense fallback={ <ModelFallback /> }>
        <MapModel />
        </Suspense>

    {/* Маркеры из базы данных POI */ }
    {
        pois.map((poi) => (
            <group
          key= { poi.id }
          position = { poi.position }
          onClick = {(e) => {
            e.stopPropagation();
            onSelectPoi?.(poi);
    }
}
className = "cursor-pointer"
    >
{/* 3D Pin */ }
    < mesh position = { [0, 0, 0]} >
        <sphereGeometry args={ [0.15, 16, 16] } />
            < meshStandardMaterial color = "#ffffff" emissive = "#ffffff" emissiveIntensity = { 0.8} />
                </mesh>
                < mesh position = { [0, -0.3, 0]} >
                    <cylinderGeometry args={ [0.02, 0.02, 0.6] } />
                        < meshStandardMaterial color = "#ffffff" />
                            </mesh>

{/* Liquid Glass Label */ }
<Html center position = { [0, 0.6, 0]} className = "pointer-events-none z-10" >
    <div className="liquid-glass px-3 py-1.5 rounded-lg flex flex-col items-center justify-center whitespace-nowrap shadow-md" >
        <span className="text-xs font-semibold text-foreground uppercase tracking-widest" >
        { poi.name }
            </span>
            </div>
            </Html>
            </group>
      ))}

<Grid
        infiniteGrid
fadeDistance = { 50}
fadeStrength = { 5}
sectionColor = "#444"
cellColor = "#222"
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

    const controlsRef = useRef<OrbitControlsImpl | null>(null);

    useEffect(() => {
        if (darkTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkTheme]);

    // Эмуляция первичного экрана загрузки
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Debounced Search с защитой от состояния гонки
    useEffect(() => {
        let isCancelled = false;

        const handler = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await api.searchPois(searchQuery);
                if (!isCancelled) {
                    setPois(results);
                }
            } catch (error) {
                console.error('Failed to fetch POIs:', error);
            } finally {
                if (!isCancelled) setIsSearching(false);
            }
        }, 300);

        return () => {
            isCancelled = true;
            clearTimeout(handler);
        };
    }, [searchQuery]);

    const toggleTheme = () => setDarkTheme((prev) => !prev);

    const handleSelectPoi = (poi: POI) => {
        if (controlsRef.current) {
            controlsRef.current.target.set(...poi.position);
            controlsRef.current.update();
        }
    };

    const handleAddPoi = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setIsAdding(true);
        try {
            const randomPos: [number, number, number] = [
                (Math.random() - 0.5) * 10,
                1.5,
                (Math.random() - 0.5) * 10,
            ];

            await api.addPoi({
                name: newName,
                type: newType,
                position: randomPos,
            });

            const results = await api.searchPois(searchQuery);
            setPois(results);
            setNewName('');
        } catch (error) {
            console.error('Failed to add POI:', error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className= "relative w-screen h-screen overflow-hidden font-sans" >
        {/* Loading Screen Overlay */ }
        < div
    className = {`absolute inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`
}
      >
    <Loader2 className="w-12 h-12 mb-4 animate-spin text-foreground" />
        <h1 className="text-2xl font-bold tracking-[0.2em] text-foreground" > INITIALIZING </h1>
            < p className = "text-sm tracking-widest uppercase mt-2 text-gray-500" > OMGTU Map </p>
                </div>

{/* 3D Canvas */ }
<div className="absolute inset-0 z-0" >
    <Canvas camera={ { position: [12, 12, 12], fov: 45 } }>
        <color attach="background" args = { [darkTheme ? '#000' : '#f4f4f5']} />
            <ambientLight intensity={ 0.5 } />
                < directionalLight position = { [10, 10, 5]} intensity = { 1.5} />

                    <MapPlaceholder pois={ pois } onSelectPoi = { handleSelectPoi } />

                        <Suspense fallback={ null }>
                            <Environment preset="city" />
                                </Suspense>

                                < OrbitControls
ref = { controlsRef }
enablePan = { true}
enableZoom = { true}
enableRotate = { true}
minPolarAngle = { 0}
maxPolarAngle = { Math.PI / 2 - 0.1 }
    />
    </Canvas>
    </div>

{/* Header */ }
<header className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none" >
    <div className="flex items-center gap-3 liquid-glass px-5 py-3 rounded-2xl pointer-events-auto" >
        <MapIcon className="w-5 h-5 text-foreground" />
            <span className="font-semibold tracking-wide uppercase text-sm" > OMGTU 3D </span>
                </div>

                < div className = "flex items-center gap-2 pointer-events-auto" >
                    <button
            className="liquid-glass p-3 rounded-full hover:bg-glass/80 transition-colors"
title = "Switch Language"
    >
    <Globe className="w-4 h-4" />
        </button>
        < button
onClick = { toggleTheme }
className = "liquid-glass p-3 rounded-full hover:bg-glass/80 transition-colors"
title = "Toggle Theme"
    >
    { darkTheme?<Sun className = "w-4 h-4" /> : <Moon className="w-4 h-4" />}
</button>
    </div>
    </header>

{/* Sidebar */ }
<aside
        className="absolute left-6 top-24 bottom-6 w-80 z-10 flex flex-col liquid-glass rounded-3xl overflow-hidden pointer-events-auto transition-transform duration-500"
style = {{ transform: loading ? 'translateX(-120%)' : 'translateX(0)' }}
      >
    <div className="p-6 border-b border-glass-border" >
        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" > Points of Interest </h2>
            < div className = "relative" >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
              type="text"
placeholder = "Search via API..."
value = { searchQuery }
onChange = {(e) => setSearchQuery(e.target.value)}
className = "w-full bg-black/5 dark:bg-white/5 border border-glass-border rounded-xl py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow placeholder:text-gray-500"
    />
{ isSearching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
            )}
</div>
    </div>

    < div className = "flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" >
    {
        pois.length > 0 ? (
            pois.map((poi) => (
                <button
                key= { poi.id }
                onClick = {() => handleSelectPoi(poi)}
className = "w-full text-left px-4 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group flex flex-col gap-1 border border-transparent hover:border-glass-border"
    >
    <span className="font-medium text-sm text-foreground flex items-center gap-2" >
        <MapPin className="w-3 h-3" />
        { poi.name }
            </span>
            < span className = "text-xs text-gray-500 uppercase tracking-wider pl-5" >
            { poi.type }
                </span>
                </button>
            ))
          ) : (
    <div className= "text-center py-8 text-gray-500 text-sm" >
    { isSearching? 'Searching database...': 'No locations found' }
    </div>
          )}
</div>

{/* Add POI Form */ }
<div className="p-4 border-t border-glass-border bg-black/5 dark:bg-white/5" >
    <form onSubmit={ handleAddPoi } className = "flex flex-col gap-3" >
        <input
              type="text"
placeholder = "New location name..."
value = { newName }
onChange = {(e) => setNewName(e.target.value)}
className = "w-full bg-transparent border border-glass-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow placeholder:text-gray-500"
required
    />
    <button
              type="submit"
disabled = { isAdding || !newName.trim()}
className = "flex items-center justify-center gap-2 bg-foreground text-background py-2 rounded-lg text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
    >
    { isAdding?<Loader2 className = "w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
{ isAdding ? 'Adding to DB...' : 'Add Marker' }
</button>
    </form>
    </div>
    </aside>

{/* Embedded Styles */ }
<style
        dangerouslySetInnerHTML={
    {
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--glass-border, rgba(255,255,255,0.2));
          border-radius: 4px;
        }
      `,
        }
}
      />
    </div>
  );
}