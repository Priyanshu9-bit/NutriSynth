import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Camera, X, Upload, RotateCcw, RefreshCw, Plus,
  Loader2, CheckCircle2, AlertCircle, AlertTriangle, Flame, Sunrise, Soup, Moon, UtensilsCrossed,
} from 'lucide-react';
import type { MealItem } from '@/lib/calculations';
import type { DetectedFood, FoodSearchHit, ResolvedFoodItem } from '@/lib/nutrition/types';
import { analyzeFoodImage } from '@/lib/nutrition/visionService';
import { getFoodDetails, resolveFoodItem, toMealItem, totalsFor } from '@/lib/nutrition/provider';
import { addRecentFood } from '@/lib/recentFoods';
import { FoodItemCard } from '@/components/nutrition/FoodItemCard';
import { InlineFoodSearch } from '@/components/nutrition/InlineFoodSearch';

type Phase = 'choose' | 'camera' | 'preview' | 'analyzing' | 'results' | 'success';
type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner' | 'Custom';

interface ScanFoodProps {
  onClose: () => void;
  onAddMeal: (meal: MealItem) => void;
}

const mealTypes: { value: MealType; icon: typeof Sunrise }[] = [
  { value: 'Breakfast', icon: Sunrise },
  { value: 'Lunch', icon: Soup },
  { value: 'Snack', icon: UtensilsCrossed },
  { value: 'Dinner', icon: Moon },
  { value: 'Custom', icon: UtensilsCrossed },
];

const ANALYSIS_STEPS = ['Identifying foods…', 'Estimating portions…', 'Finding nutrition data…', 'Calculating calories…'];

export function ScanFood({ onClose, onAddMeal }: ScanFoodProps) {
  const [phase, setPhase] = useState<Phase>('choose');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'upload' | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);

  // Results
  const [items, setItems] = useState<ResolvedFoodItem[]>([]);
  const [unresolved, setUnresolved] = useState<DetectedFood[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [changingUid, setChangingUid] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>('Lunch');
  const [mealName, setMealName] = useState('');
  const [mealNameTouched, setMealNameTouched] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedImageRef = useRef<string | null>(null);

  useEffect(() => {
    capturedImageRef.current = capturedImage;
  }, [capturedImage]);

  // Stop the camera and release the captured-image object URL on unmount.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (capturedImageRef.current) URL.revokeObjectURL(capturedImageRef.current);
    };
  }, []);

  // Step through the "Analyzing…" copy while the request is in flight.
  useEffect(() => {
    if (phase !== 'analyzing') return;
    setAnalysisStep(0);
    const id = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
    }, 600);
    return () => clearInterval(id);
  }, [phase]);

  // Auto-generate the meal name from resolved foods until the user edits it.
  useEffect(() => {
    if (mealNameTouched) return;
    const names = items.map((i) => i.food.name);
    setMealName(names.length ? names.join(' + ') : '');
  }, [items, mealNameTouched]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function setImage(url: string | null) {
    setCapturedImage((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  async function startCamera(mode: 'environment' | 'user' = facingMode) {
    setCameraError(null);
    setUploadError(null);

    if (!window.isSecureContext) {
      setCameraError('Camera requires a secure (HTTPS) connection. You can upload a food photo instead.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser. You can upload a food photo instead.');
      return;
    }

    stopStream();

    const tryConstraints = async (constraints: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    };

    try {
      await tryConstraints({ video: { facingMode: { ideal: mode } }, audio: false });
      setFacingMode(mode);
      setPhase('camera');
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1);
      } catch {
        // Device enumeration is a nicety; ignore failures.
      }
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === 'OverconstrainedError') {
        try {
          await tryConstraints({ video: true, audio: false });
          setPhase('camera');
          return;
        } catch (fallbackErr) {
          setCameraError(describeCameraError(fallbackErr));
          return;
        }
      }
      setCameraError(describeCameraError(err));
    }
  }

  function describeCameraError(err: unknown): string {
    const name = (err as DOMException)?.name;
    switch (name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera access was denied. You can upload a food photo instead.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera was found on this device. You can upload a food photo instead.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'The camera is already in use by another app. You can upload a food photo instead.';
      default:
        return 'Could not access the camera. You can upload a food photo instead.';
    }
  }

  function switchCamera() {
    startCamera(facingMode === 'environment' ? 'user' : 'environment');
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setImage(URL.createObjectURL(blob));
        setImageSource('camera');
        stopStream();
        setPhase('preview');
      },
      'image/jpeg',
      0.9
    );
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('That photo is too large (max 15MB). Please choose a smaller file.');
      return;
    }
    setUploadError(null);
    setCameraError(null);
    stopStream();
    setImage(URL.createObjectURL(file));
    setImageSource('upload');
    setPhase('preview');
  }

  function handleRetake() {
    setImage(null);
    setCameraError(null);
    setUploadError(null);
    if (imageSource === 'camera') {
      startCamera();
    } else if (imageSource === 'upload') {
      setPhase('choose');
      fileInputRef.current?.click();
    } else {
      setPhase('choose');
    }
  }

  function handleCancelCamera() {
    setImageSource(null);
    stopStream();
    setPhase('choose');
  }

  async function handleAnalyze() {
    if (!capturedImage) return;
    setPhase('analyzing');

    // capturedImage is an object URL (blob:...) — the vision Edge Function needs
    // actual image bytes, so read it back out as a data URL before sending.
    let dataUrl: string;
    try {
      const blob = await fetch(capturedImage).then((r) => r.blob());
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      setItems([]);
      setUnresolved([]);
      setUsedFallback(true);
      setPhase('results');
      return;
    }

    const { detected, usedFallback: fellBack } = await analyzeFoodImage(dataUrl);
    setUsedFallback(fellBack);

    const resolved: ResolvedFoodItem[] = [];
    const failed: DetectedFood[] = [];
    for (const d of detected) {
      const item = await resolveFoodItem(d.name, d.quantity, d.unit, d.confidence);
      if (item) {
        resolved.push(item);
        addRecentFood({ id: item.food.id, name: item.food.name });
      } else {
        failed.push(d);
      }
    }

    setItems(resolved);
    setUnresolved(failed);
    setPhase('results');
  }

  async function addFood(hit: FoodSearchHit) {
    const food = await getFoodDetails(hit);
    if (!food) return;
    setItems((prev) => [...prev, { uid: `${food.id}-${Date.now()}`, food, multiplier: 1 }]);
    addRecentFood({ id: food.id, name: food.name });
    setAddFoodOpen(false);
  }

  async function changeFood(uid: string, hit: FoodSearchHit) {
    const food = await getFoodDetails(hit);
    if (!food) return;
    setItems((prev) => prev.map((i) => (i.uid === uid ? { ...i, food, confidence: undefined } : i)));
    addRecentFood({ id: food.id, name: food.name });
    setChangingUid(null);
  }

  async function resolveUnknown(detected: DetectedFood, hit: FoodSearchHit) {
    const food = await getFoodDetails(hit);
    if (!food) return;
    setItems((prev) => [...prev, { uid: `${food.id}-${Date.now()}`, food, multiplier: 1 }]);
    addRecentFood({ id: food.id, name: food.name });
    setUnresolved((prev) => prev.filter((u) => u !== detected));
  }

  function removeFood(uid: string) {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }

  function adjustPortion(uid: string, delta: number) {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, multiplier: Math.max(0.25, +(i.multiplier + delta).toFixed(2)) } : i))
    );
  }

  const totals = totalsFor(items);

  function handleAddToIntake() {
    if (items.length === 0) return;
    onAddMeal(toMealItem(items, mealName, mealType));
    setPhase('success');
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#0B0F0E] text-[#F8FAFC] border border-[#1E293B] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="font-display font-semibold text-lg text-[#F8FAFC]">Scan Food</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[#101D2D] text-[#8492A6] hover:text-[#F8FAFC] transition-colors" aria-label="Close scanner">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Always mounted so "Choose Another" can re-open it from the preview screen too */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          {/* CHOOSE: camera or upload */}
          {phase === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">Take a photo of your meal, or upload one from your gallery.</p>

              {cameraError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
              {uploadError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <button onClick={() => startCamera()} className="btn-primary w-full">
                <Camera className="w-4 h-4" /> Open Camera
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary w-full">
                <Upload className="w-4 h-4" /> Upload from Gallery
              </button>
            </div>
          )}

          {/* CAMERA: live preview */}
          {phase === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-stone-900 aspect-[4/3]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-brand-400/60 shadow-[0_0_12px_2px_rgba(34,197,94,0.5)] animate-pulse" />
                {hasMultipleCameras && (
                  <button
                    onClick={switchCamera}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                    aria-label="Switch camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleCancelCamera} className="btn-secondary flex-1">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={capturePhoto} className="btn-primary flex-1">
                  <Camera className="w-4 h-4" /> Capture
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW: captured/uploaded image */}
          {phase === 'preview' && capturedImage && (
            <div className="space-y-3">
              <img src={capturedImage} alt="Captured meal" className="w-full rounded-xl object-cover max-h-80" />
              <div className="flex gap-2">
                <button onClick={handleRetake} className="btn-secondary flex-1">
                  <RotateCcw className="w-4 h-4" /> {imageSource === 'upload' ? 'Choose Another' : 'Retake'}
                </button>
                <button onClick={handleAnalyze} className="btn-primary flex-1">
                  Analyze Food
                </button>
              </div>
            </div>
          )}

          {/* ANALYZING */}
          {phase === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-sm font-medium">🔍 Analyzing your meal…</p>
              <p className="text-xs text-stone-400">{ANALYSIS_STEPS[analysisStep]}</p>
            </div>
          )}

          {/* RESULTS: identify, portion, breakdown, meal info */}
          {phase === 'results' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display font-semibold text-stone-900 mb-1">What's in this meal?</h3>
                <p className="text-xs text-stone-500">
                  {usedFallback
                    ? "We couldn't run AI image recognition (no vision provider connected), so here's a starting list — add, remove, or search to match what's on your plate."
                    : 'Please confirm the detected food and portion before adding it to your intake.'}
                </p>
              </div>

              {items.length === 0 && unresolved.length === 0 && (
                <div className="text-sm text-stone-500 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  No foods added yet. Use "+ Add Food" below to build your meal.
                </div>
              )}

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.uid}>
                    <FoodItemCard
                      item={item}
                      onAdjust={(delta) => adjustPortion(item.uid, delta)}
                      onRemove={() => removeFood(item.uid)}
                      onChangeFood={() => setChangingUid(changingUid === item.uid ? null : item.uid)}
                    />
                    {changingUid === item.uid && (
                      <div className="mt-2 p-3 rounded-xl border border-stone-200 bg-stone-50">
                        <InlineFoodSearch
                          placeholder={`What is it actually? (not ${item.food.name})`}
                          autoFocus
                          onSelect={(hit) => changeFood(item.uid, hit)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Unknown / unresolved detections — never silently invented */}
              {unresolved.length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      ⚠️ Food not found — detected "<strong>{unresolved[0].name}</strong>" but couldn't match it to nutrition
                      data.
                    </span>
                  </div>
                  <InlineFoodSearch
                    placeholder="Search manually…"
                    onSelect={(hit) => resolveUnknown(unresolved[0], hit)}
                  />
                  <button
                    onClick={() => setUnresolved((prev) => prev.slice(1))}
                    className="text-xs text-stone-500 hover:text-stone-800 underline"
                  >
                    Skip this item
                  </button>
                </div>
              )}

              {/* Add food */}
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <button
                  onClick={() => setAddFoodOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Food
                  </span>
                </button>
                {addFoodOpen && (
                  <div className="px-3 pb-3 animate-fade-in">
                    <InlineFoodSearch onSelect={addFood} />
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <>
                  {/* Total breakdown */}
                  <div className="rounded-xl bg-[#101D2D] border border-[#1E293B] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-400" /> Total
                      </span>
                      <span className="metric-value text-xl text-[#F8FAFC]">
                        {Math.round(totals.calories)} <span className="text-sm font-medium text-[#8492A6]">kcal</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Protein', val: totals.protein },
                        { label: 'Carbs', val: totals.carbs },
                        { label: 'Fat', val: totals.fat },
                        { label: 'Fiber', val: totals.fiber },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="text-sm font-semibold text-[#F8FAFC] tabular-nums">{Math.round(m.val)}g</div>
                          <div className="text-[10px] text-[#8492A6]">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meal type */}
                  <div>
                    <div className="text-sm font-semibold text-[#CBD5E1] mb-2">Meal Type</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {mealTypes.map(({ value, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setMealType(value)}
                          className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[11px] font-medium transition-colors ${
                            mealType === value
                              ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#34D399]'
                              : 'border-[#1E293B] text-[#8492A6] hover:bg-[#101D2D]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal name */}
                  <div>
                    <div className="text-sm font-semibold text-[#CBD5E1] mb-2">Meal Name</div>
                    <input
                      type="text"
                      value={mealName}
                      onChange={(e) => {
                        setMealName(e.target.value);
                        setMealNameTouched(true);
                      }}
                      placeholder="e.g. Paneer Rice Lunch"
                      className="input-field py-2 text-sm"
                    />
                  </div>

                  <p className="text-[11px] text-[#8492A6]">
                    Nutrition values are estimates and may vary based on ingredients, preparation method, and portion size.
                  </p>

                  <button onClick={handleAddToIntake} disabled={items.length === 0} className="btn-primary w-full">
                    <CheckCircle2 className="w-4 h-4" /> Add to Today's Intake
                  </button>
                </>
              )}
            </div>
          )}

          {/* SUCCESS */}
          {phase === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#34D399]" />
              </div>
              <h3 className="font-display font-semibold text-lg text-[#F8FAFC]">Meal added!</h3>
              <p className="text-sm text-[#CBD5E1]">
                {mealName || 'Your meal'} — {Math.round(totals.calories)} kcal added to Today's Intake.
              </p>
              <button onClick={handleClose} className="btn-primary mt-2">
                Done
              </button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

