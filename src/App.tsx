/**
 * App.tsx - Apex GT: Square Circuit 3D Racing
 * High performance WebGL 3D racing simulator with realistic damage physics,
 * synthesized engine audio, dynamic soft lighting and responsive mobile controls.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RacingGameEngine, GameTelemetry, CameraDistanceMode } from './game/RacingGameEngine';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { CarInputs } from './game/physics/VehiclePhysics';
import { Play, Volume2, X, Upload, CheckCircle2, AlertCircle, RefreshCw, Car } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RacingGameEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speedKmh: 0,
    rpm: 1000,
    engineTemp: 85,
    gear: 1,
    health: 100,
    engineHealth: 100,
    suspLeft: 100,
    suspRight: 100,
    lapTime: 0,
    bestLap: null,
    lapCount: 1,
    isDrifting: false,
    isInPit: false,
    pitProgress: 0,
    pitPhase: 'none',
    pitTimeRemaining: 0,
    pitTotalTime: 0,
    radioMessage: null,
    broadcastCamName: null,
    isMuted: false,
    cameraMode: 'chase',
    cameraDistance: 'medium',
    carName: 'F1 Turbo GP',
    isCustomCar: false,
    isNightMode: false,
  });

  const [carPos, setCarPos] = useState({ x: -10, z: -130, yaw: Math.PI / 2 });

  // Initialize 3D Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new RacingGameEngine(containerRef.current);
    engineRef.current = engine;

    engine.onTelemetryUpdate = (data) => {
      setTelemetry(data);
      if (engine.physics) {
        setCarPos({
          x: engine.physics.position.x,
          z: engine.physics.position.z,
          yaw: engine.physics.yaw,
        });
      }
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keyboard Controls
  useEffect(() => {
    const activeKeys = new Set<string>();

    const updateInputs = () => {
      if (!engineRef.current) return;
      const throttle = activeKeys.has('KeyW') || activeKeys.has('ArrowUp') ? 1.0 : 0.0;
      const brake = activeKeys.has('KeyS') || activeKeys.has('ArrowDown') ? 1.0 : 0.0;
      let steering = 0;
      if (activeKeys.has('KeyA') || activeKeys.has('ArrowLeft')) steering += 1.0;
      if (activeKeys.has('KeyD') || activeKeys.has('ArrowRight')) steering -= 1.0;
      const handbrake = activeKeys.has('Space');

      engineRef.current.inputs.throttle = throttle;
      engineRef.current.inputs.brake = brake;
      engineRef.current.inputs.steering = steering;
      engineRef.current.inputs.handbrake = handbrake;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted) {
        setHasStarted(true);
        engineRef.current?.resumeAudio();
      }

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyC') {
        engineRef.current?.nextCameraDistance();
        return;
      }
      if (e.code === 'KeyR') {
        engineRef.current?.repairCar();
        return;
      }
      if (e.code === 'KeyM') {
        engineRef.current?.toggleAudio();
        return;
      }
      if (e.code === 'KeyN') {
        engineRef.current?.toggleDayNightMode();
        return;
      }

      activeKeys.add(e.code);
      updateInputs();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.code);
      updateInputs();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hasStarted]);

  // Touch input handler
  const handleTouchInput = useCallback((inputs: Partial<CarInputs>) => {
    if (!engineRef.current) return;
    if (!hasStarted) {
      setHasStarted(true);
      engineRef.current.resumeAudio();
    }
    if (inputs.throttle !== undefined) engineRef.current.inputs.throttle = inputs.throttle;
    if (inputs.brake !== undefined) engineRef.current.inputs.brake = inputs.brake;
    if (inputs.steering !== undefined) engineRef.current.inputs.steering = inputs.steering;
    if (inputs.handbrake !== undefined) engineRef.current.inputs.handbrake = inputs.handbrake;
  }, [hasStarted]);

  const handleStartGame = () => {
    setHasStarted(true);
    engineRef.current?.resumeAudio();
  };

  const handleSwitchCamera = useCallback(() => {
    engineRef.current?.nextCameraMode();
  }, []);

  const handleSelectCameraDistance = useCallback((dist: CameraDistanceMode) => {
    engineRef.current?.setCameraDistance(dist);
  }, []);

  const handleRepair = useCallback(() => {
    engineRef.current?.repairCar();
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.resetCarToTrack();
  }, []);

  const handleToggleAudio = useCallback(() => {
    engineRef.current?.toggleAudio();
  }, []);

  const handleToggleDayNight = useCallback(() => {
    engineRef.current?.toggleDayNightMode();
  }, []);

  const handleCarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !engineRef.current) return;

    setIsLoadingFile(true);
    setUploadMessage({ type: 'info', text: `Cargando y procesando "${file.name}"...` });

    try {
      const res = await engineRef.current.loadCustomCar(file);
      if (res.success) {
        setUploadMessage({
          type: 'success',
          text: `¡Coche "${res.name}" cargado y listo para correr!`,
        });
        setTimeout(() => {
          setShowCarModal(false);
          setUploadMessage(null);
        }, 2200);
      } else {
        setUploadMessage({
          type: 'error',
          text: res.error || 'Error al procesar el archivo 3D.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadMessage({ type: 'error', text: msg });
    } finally {
      setIsLoadingFile(false);
      e.target.value = '';
    }
  };

  const handleRestoreDefaultCar = () => {
    if (!engineRef.current) return;
    engineRef.current.restoreDefaultCar();
    setUploadMessage({
      type: 'success',
      text: 'Se ha restaurado el coche de carreras predeterminado.',
    });
    setTimeout(() => {
      setShowCarModal(false);
      setUploadMessage(null);
    }, 1800);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none touch-none">
      {/* Hidden File Input for 3D Car Models */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.glb,.gltf,.obj"
        className="hidden"
        onChange={handleCarFileUpload}
      />

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        onClick={() => {
          if (!hasStarted) {
            setHasStarted(true);
            engineRef.current?.resumeAudio();
          }
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Start Game & Audio Unlock Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-40 text-center animate-fade-in">
          <div className="bg-neutral-900/90 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">APEX GT RACING</h1>
              <p className="text-xs text-neutral-400">
                Circuito Cuadrado · Físicas de Daños · Sonido de Motor Procedural
              </p>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm tracking-wide transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
            >
              <Volume2 className="w-4 h-4" />
              INICIAR CARRERA Y AUDIO
            </button>

            <div className="text-[11px] text-neutral-400 text-center">
              Acelera con Gas / W, gira con volante / A-D, derrapa con Drift / ESPACIO. Chocar contra árboles o muros dañará el coche.
            </div>
          </div>
        </div>
      )}

      {/* Racing HUD */}
      <HUD
        telemetry={telemetry}
        carPosition={carPos}
        onSwitchCamera={handleSwitchCamera}
        onSelectCameraDistance={handleSelectCameraDistance}
        onRepair={handleRepair}
        onReset={handleReset}
        onToggleAudio={handleToggleAudio}
        onToggleDayNight={handleToggleDayNight}
        onOpenCarUpload={() => setShowCarModal(true)}
      />

      {/* Mobile Touch Ergonomic Controls */}
      <TouchControls onInputChange={handleTouchInput} />

      {/* Custom Car Upload Modal (Import .ZIP, .GLB, .GLTF, .OBJ) */}
      {showCarModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-neutral-900/95 border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-neutral-950/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white tracking-wide">CAMBIAR COCHE / IMPORTAR 3D</h3>
                  <p className="text-[11px] text-neutral-400">Sube tu modelo F1 descargado</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCarModal(false);
                  setUploadMessage(null);
                }}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4">
              {/* Current Active Vehicle Info */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Coche en uso actual</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${telemetry.isCustomCar ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {telemetry.carName}
                  </span>
                </div>
                {telemetry.isCustomCar && (
                  <button
                    onClick={handleRestoreDefaultCar}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-neutral-300 hover:text-white flex items-center gap-1 border border-white/10"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-400" />
                    <span>Restaurar Predeterminado</span>
                  </button>
                )}
              </div>

              {/* Upload Drop Zone / Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500/80 bg-emerald-950/20 hover:bg-emerald-950/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-3 active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm text-white">
                    Toca aquí para seleccionar tu archivo F1
                  </span>
                  <span className="text-xs text-neutral-300">
                    Soporta <strong className="text-emerald-400">.ZIP</strong> (la descarga directa de CGTrader con texturas), <strong className="text-emerald-400">.GLB</strong>, <strong className="text-emerald-400">.GLTF</strong> u <strong className="text-emerald-400">.OBJ</strong>
                  </span>
                </div>

                <button
                  type="button"
                  className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider transition-colors shadow-lg shadow-emerald-950/50"
                >
                  SELECCIONAR ARCHIVO DESDE TU DISPOSITIVO
                </button>
              </div>

              {/* Status or Progress Feedback */}
              {isLoadingFile && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-xs text-cyan-200 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                  <span>Procesando geometría 3D, texturas y dimensiones de F1...</span>
                </div>
              )}

              {uploadMessage && !isLoadingFile && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${
                    uploadMessage.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                      : uploadMessage.type === 'error'
                      ? 'bg-red-950/50 border-red-500/40 text-red-200'
                      : 'bg-neutral-800/80 border-white/10 text-neutral-300'
                  }`}
                >
                  {uploadMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : uploadMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <Car className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  )}
                  <span>{uploadMessage.text}</span>
                </div>
              )}

              {/* Helpful Tips for CGTrader */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 text-[11px] text-neutral-400 flex flex-col gap-1">
                <span className="font-semibold text-neutral-300">💡 Consejo para la descarga de CGTrader:</span>
                <span>
                  Puedes subir directamente el archivo <strong>.ZIP</strong> que te descargó el navegador en tu móvil; el juego lo descomprime automáticamente en memoria y aplica las texturas.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
