/**
 * HUD.tsx - Clean racing telemetry heads-up display
 * Speedometer, dynamic RPM tachometer, lap timers, square circuit mini-map,
 * car damage telemetry diagram, 3-distance camera selector, and responsive action controls.
 */

import React from 'react';
import { Camera, Volume2, VolumeX, Wrench, RotateCcw, Maximize, Flame, Radio, Upload, Moon, Sun } from 'lucide-react';
import { GameTelemetry, CameraDistanceMode } from '../game/RacingGameEngine';

interface HUDProps {
  telemetry: GameTelemetry;
  carPosition: { x: number; z: number; yaw: number };
  onSwitchCamera: () => void;
  onSelectCameraDistance: (distance: CameraDistanceMode) => void;
  onRepair: () => void;
  onReset: () => void;
  onToggleAudio: () => void;
  onToggleDayNight?: () => void;
  onOpenCarUpload?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  carPosition,
  onSwitchCamera,
  onSelectCameraDistance,
  onRepair,
  onReset,
  onToggleAudio,
  onToggleDayNight,
  onOpenCarUpload,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 1000) % 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // RPM percentage (0% at 1000, 100% at 9200)
  const rpmPercent = Math.min(100, Math.max(0, ((telemetry.rpm - 1000) / 8200) * 100));
  const isRedline = telemetry.rpm > 8200;

  // Mini-map coordinates translation
  // Track is ~280m x 280m (-140 to +140)
  // Map size: 100x100px. Center: (50, 50). Scale: 100 / 280 = 0.357
  const mapX = 50 + (carPosition.x * 0.35);
  const mapY = 50 + (carPosition.z * 0.35);
  const carHeadingDeg = (carPosition.yaw * 180) / Math.PI;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 select-none">
      {/* 
        LANDSCAPE MODE HUD: Unified Single-Row Perimeter Header
        In landscape mode (mobile horizontal or desktop landscape), all telemetry and actions are organized
        in a single ultra-compact top perimeter bar with ZERO obstruction across the central driving screen!
      */}
      <div className="pointer-events-auto w-full max-w-full z-20">
        
        {/* === LANDSCAPE SPECIFIC HEADER (Active in landscape mode) === */}
        <div className="hidden landscape:flex items-center justify-between gap-2 w-full bg-neutral-950/75 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1 shadow-lg">
          {/* Left: Compact Circuit Radar & Lap Timer */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Radar Mini-map */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-neutral-900/90 rounded-lg border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full p-0.5 opacity-80">
                <rect x="8" y="8" width="84" height="84" rx="14" ry="14" fill="none" stroke="#52525b" strokeWidth="6" />
                <rect x="8" y="8" width="84" height="84" rx="14" ry="14" fill="none" stroke="#18181b" strokeWidth="4" />
                <line x1="42" y1="92" x2="58" y2="92" stroke="#ef4444" strokeWidth="3" />
                <line x1="40" y1="83" x2="65" y2="83" stroke="#10b981" strokeWidth="2" strokeDasharray="2,2" />
              </svg>
              <div
                className="absolute w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm transition-transform duration-75"
                style={{
                  left: `${Math.min(92, Math.max(8, mapX))}%`,
                  top: `${Math.min(92, Math.max(8, mapY))}%`,
                  transform: `translate(-50%, -50%) rotate(${carHeadingDeg}deg)`,
                }}
              >
                <div className="w-0.5 h-1 bg-white mx-auto -mt-0.5 rounded-full" />
              </div>
            </div>

            {/* Lap Counter & Digital Chronometer */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>VUELTA {telemetry.lapCount}</span>
                {telemetry.isDrifting && (
                  <span className="flex items-center gap-0.5 text-amber-400 font-black text-[9px] animate-pulse">
                    <Flame className="w-2.5 h-2.5" /> DRIFT
                  </span>
                )}
              </div>
              <div className="text-sm font-black font-mono tracking-tight text-white tabular-nums leading-none">
                {formatTime(telemetry.lapTime)}
              </div>
              <div className="text-[9px] text-neutral-400 font-mono tabular-nums">
                Mejor: {telemetry.bestLap ? formatTime(telemetry.bestLap) : '--:--.---'}
              </div>
            </div>
          </div>

          {/* Center: High-Performance Integrated Speedometer & RPM Telemetry */}
          <div className="flex items-center gap-2 sm:gap-3 bg-neutral-900/80 border border-white/10 rounded-lg px-2.5 py-0.5 shadow-inner shrink-0">
            {/* Gear Indicator */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase font-bold text-neutral-400">M</span>
              <span className={`text-base font-black font-mono ${telemetry.gear === -1 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                {telemetry.gear === -1 ? 'R' : telemetry.gear === 0 ? 'N' : telemetry.gear}
              </span>
            </div>

            <div className="w-px h-3 bg-white/15" />

            {/* Speed Display */}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black font-mono tracking-tight text-white tabular-nums">
                {telemetry.speedKmh}
              </span>
              <span className="text-[9px] font-bold text-neutral-400">KM/H</span>
            </div>

            <div className="w-px h-3 bg-white/15" />

            {/* RPM Tachometer */}
            <div className="flex items-center gap-1.5">
              <div className="w-14 sm:w-20 h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isRedline
                      ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600 animate-pulse'
                      : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500'
                  }`}
                  style={{ width: `${rpmPercent}%` }}
                />
              </div>
              <span className={`text-[9px] font-mono font-bold tabular-nums ${isRedline ? 'text-red-400 animate-pulse' : 'text-neutral-400'}`}>
                {(telemetry.rpm / 1000).toFixed(1)}k
              </span>
            </div>
          </div>

          {/* Right: Health Metrics & Action Toolset (Sleek Compact Perimeter Layout) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Health Bars */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-white/10 rounded-lg px-2 py-0.5">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1 text-[8px] uppercase font-semibold text-neutral-400">
                  <span>MOT</span>
                  <span className={`font-mono tabular-nums ${telemetry.engineTemp > 108 ? 'text-amber-400 font-bold' : 'text-neutral-200'}`}>
                    {telemetry.engineTemp || 85}°C
                  </span>
                </div>
                <div className="w-10 h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      telemetry.engineHealth > 70 ? 'bg-emerald-400' : telemetry.engineHealth > 35 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${telemetry.engineHealth}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1 text-[8px] uppercase font-semibold text-neutral-400">
                  <span>CHAS</span>
                  <span className={`font-mono tabular-nums ${telemetry.health < 50 ? 'text-red-400 font-bold' : 'text-neutral-200'}`}>
                    {telemetry.health}%
                  </span>
                </div>
                <div className="w-10 h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      telemetry.health > 70 ? 'bg-blue-400' : telemetry.health > 35 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${telemetry.health}%` }}
                  />
                </div>
              </div>

              <button
                onClick={onRepair}
                title="Reparar Coche (R)"
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition-colors active:scale-95"
              >
                <Wrench className="w-3 h-3" />
              </button>
            </div>

            {/* Camera Distance Selector */}
            <div className="flex items-center bg-neutral-900/90 border border-white/10 rounded-lg p-0.5">
              {(['near', 'medium', 'far'] as CameraDistanceMode[]).map((dist) => {
                const labels = { near: 'CER', medium: 'MED', far: 'LEJ' };
                const isActive = telemetry.cameraDistance === dist && telemetry.cameraMode === 'chase';
                return (
                  <button
                    key={dist}
                    onClick={() => onSelectCameraDistance(dist)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider transition-all ${
                      isActive
                        ? 'bg-amber-500 text-neutral-950 font-black'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {labels[dist]}
                  </button>
                );
              })}
            </div>

            {/* Quick Action Icons */}
            {onOpenCarUpload && (
              <button
                onClick={onOpenCarUpload}
                title="Cargar F1 (.zip, .glb, .obj)"
                className="px-1.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white transition-colors active:scale-95 flex items-center gap-1 text-[9px] font-bold"
              >
                <Upload className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">F1</span>
              </button>
            )}

            {onToggleDayNight && (
              <button
                onClick={onToggleDayNight}
                title={telemetry.isNightMode ? 'Cambiar a Día' : 'Cambiar a Noche con Focos'}
                className={`p-1 rounded-lg transition-colors active:scale-95 ${
                  telemetry.isNightMode ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                }`}
              >
                {telemetry.isNightMode ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
              </button>
            )}

            <button
              onClick={onToggleAudio}
              title={telemetry.isMuted ? 'Activar Sonido' : 'Silenciar'}
              className="p-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95"
            >
              {telemetry.isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-neutral-200" />}
            </button>

            <button
              onClick={onReset}
              title="Reiniciar Coche"
              className="p-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              onClick={handleFullscreen}
              title="Pantalla Completa"
              className="p-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95"
            >
              <Maximize className="w-3 h-3" />
            </button>
          </div>
        </div>


        {/* === PORTRAIT SPECIFIC HEADER (Active in vertical mode) === */}
        <div className="flex landscape:hidden flex-col gap-1.5 w-full">
          {/* Row 1: Lap Times & Circuit Map (Left) + Health / Damage (Right) */}
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Left: Lap Times & Circuit Map */}
            <div className="flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-lg">
              {/* Mini-map */}
              <div className="relative w-11 h-11 bg-neutral-900/90 rounded-lg border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full p-0.5 opacity-80">
                  <rect x="8" y="8" width="84" height="84" rx="14" ry="14" fill="none" stroke="#52525b" strokeWidth="6" />
                  <rect x="8" y="8" width="84" height="84" rx="14" ry="14" fill="none" stroke="#18181b" strokeWidth="4" />
                  <line x1="42" y1="92" x2="58" y2="92" stroke="#ef4444" strokeWidth="3" />
                  <line x1="40" y1="83" x2="65" y2="83" stroke="#10b981" strokeWidth="2" strokeDasharray="2,2" />
                </svg>
                <div
                  className="absolute w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm transition-transform duration-75"
                  style={{
                    left: `${Math.min(92, Math.max(8, mapX))}%`,
                    top: `${Math.min(92, Math.max(8, mapY))}%`,
                    transform: `translate(-50%, -50%) rotate(${carHeadingDeg}deg)`,
                  }}
                >
                  <div className="w-0.5 h-1 bg-white mx-auto -mt-0.5 rounded-full" />
                </div>
              </div>

              {/* Lap Information */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <span>VUELTA {telemetry.lapCount}</span>
                  {telemetry.isDrifting && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold text-[9px] animate-pulse">
                      <Flame className="w-2.5 h-2.5" /> DRIFT
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold font-mono tracking-tight text-white tabular-nums">
                  {formatTime(telemetry.lapTime)}
                </div>
                <div className="text-[9px] text-neutral-400 font-mono tabular-nums">
                  Mejor: {telemetry.bestLap ? formatTime(telemetry.bestLap) : '--:--.---'}
                </div>
              </div>
            </div>

            {/* Right: Health Telemetry & Repair */}
            <div className="bg-neutral-950/85 backdrop-blur-md border border-white/10 rounded-xl px-2 py-1.5 flex items-center gap-2 shadow-lg shrink-0">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-1 text-[8px] uppercase font-semibold text-neutral-400">
                  <span>Motor</span>
                  <span className={`font-mono tabular-nums ${telemetry.engineTemp > 108 ? 'text-amber-400 font-bold' : 'text-neutral-200'}`}>
                    {telemetry.engineTemp || 85}°C
                  </span>
                </div>
                <div className="w-14 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      telemetry.engineHealth > 70 ? 'bg-emerald-400' : telemetry.engineHealth > 35 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${telemetry.engineHealth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 text-[8px] uppercase font-semibold text-neutral-400">
                  <span>Chasis</span>
                  <span className={`font-mono tabular-nums ${telemetry.health < 50 ? 'text-red-400 font-bold' : 'text-neutral-200'}`}>
                    {telemetry.health}%
                  </span>
                </div>
                <div className="w-14 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      telemetry.health > 70 ? 'bg-blue-400' : telemetry.health > 35 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${telemetry.health}%` }}
                  />
                </div>
              </div>

              <button
                onClick={onRepair}
                title="Reparar Coche (R)"
                className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center justify-center border border-white/5 active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Row 2: Mobile Action Bar in Portrait */}
          <div className="flex items-center justify-between gap-1 w-full bg-neutral-950/85 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-lg">
            {onOpenCarUpload && (
              <button
                onClick={onOpenCarUpload}
                title="Cargar mi modelo 3D F1 (.zip, .glb, .gltf, .obj)"
                className="px-2 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 hover:text-white transition-all active:scale-95 flex items-center gap-1 font-bold text-xs shrink-0"
              >
                <Upload className="w-3 h-3 text-emerald-400" />
                <span>CARGAR F1</span>
              </button>
            )}

            {/* 3-Distance Camera Selector */}
            <div className="flex items-center bg-neutral-900/90 border border-white/10 rounded-lg p-0.5 shrink-0">
              {(['near', 'medium', 'far'] as CameraDistanceMode[]).map((dist) => {
                const labels = { near: 'CERCA', medium: 'MEDIA', far: 'LEJOS' };
                const isActive = telemetry.cameraDistance === dist && telemetry.cameraMode === 'chase';
                return (
                  <button
                    key={dist}
                    onClick={() => onSelectCameraDistance(dist)}
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider transition-all ${
                      isActive
                        ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {labels[dist]}
                  </button>
                );
              })}
            </div>

            {/* Right Utility Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onSwitchCamera}
                title="Alternar vista de cámara"
                className="p-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              {onToggleDayNight && (
                <button
                  onClick={onToggleDayNight}
                  title={telemetry.isNightMode ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche con Focos'}
                  className={`p-1 rounded-lg transition-all active:scale-95 flex items-center gap-1 ${
                    telemetry.isNightMode
                      ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-500/50 shadow-sm'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 hover:bg-amber-900/90'
                  }`}
                >
                  {telemetry.isNightMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              )}
              <button
                onClick={onToggleAudio}
                title={telemetry.isMuted ? 'Activar Sonido' : 'Silenciar'}
                className="p-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95"
              >
                {telemetry.isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-neutral-200" />}
              </button>
              <button
                onClick={onReset}
                title="Reiniciar Coche"
                className="p-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFullscreen}
                title="Pantalla Completa"
                className="p-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors active:scale-95"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 3: Speedometer in Portrait */}
          <div className="flex items-center justify-center pointer-events-none w-full">
            <div className="bg-neutral-950/85 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1 flex items-center gap-2.5 shadow-xl pointer-events-auto">
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase font-bold text-neutral-400">MARCHA</span>
                <span className={`text-base font-black font-mono ${telemetry.gear === -1 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                  {telemetry.gear === -1 ? 'R' : telemetry.gear === 0 ? 'N' : telemetry.gear}
                </span>
              </div>
              <div className="w-px h-3.5 bg-white/10" />
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black font-mono tracking-tight text-white tabular-nums">
                  {telemetry.speedKmh}
                </span>
                <span className="text-[9px] font-bold text-neutral-400">KM/H</span>
              </div>
              <div className="w-px h-3.5 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      isRedline
                        ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600 animate-pulse'
                        : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500'
                    }`}
                    style={{ width: `${rpmPercent}%` }}
                  />
                </div>
                <span className={`text-[9px] font-mono font-bold tabular-nums ${isRedline ? 'text-red-400 animate-pulse' : 'text-neutral-400'}`}>
                  {(telemetry.rpm / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Pit Stop Telemetry Card (if in pit) */}
        {telemetry.isInPit && (
          <div className="bg-neutral-950/95 border-2 border-emerald-500/70 rounded-2xl px-4 py-2 text-center backdrop-blur-xl shadow-2xl shadow-emerald-950/60 max-w-sm mx-auto flex flex-col gap-1 mt-2 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
            {telemetry.broadcastCamName && (
              <div className="flex items-center justify-center gap-1.5 bg-red-950/60 border border-red-500/40 rounded py-0.5 px-2 text-[8px] font-bold text-red-200 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                <span>EN DIRECTO · {telemetry.broadcastCamName}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1 text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wide">
                {telemetry.pitPhase === 'entry' && 'ENTRANDO A BOXES'}
                {telemetry.pitPhase === 'jacking' && 'LEVANTANDO COCHE'}
                {telemetry.pitPhase === 'service' && 'REPARACIÓN MECÁNICA'}
                {telemetry.pitPhase === 'exit' && 'SALIDA DE BOXES'}
              </span>
              <span className="font-mono font-bold text-white tabular-nums">
                {telemetry.pitTimeRemaining.toFixed(1)}s
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                style={{ width: `${Math.min(100, telemetry.pitProgress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
