import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { Upload, Leaf, Loader2, AlertCircle, CheckCircle2, Sparkles, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import heroLeaf from "@/assets/hero-leaf.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

type Diagnosis = {
  is_plant: boolean;
  plant_name: string;
  is_healthy: boolean;
  disease_name: string;
  confidence: number;
  severity: "none" | "mild" | "moderate" | "severe";
  symptoms: string[];
  causes: string[];
  treatments: string[];
  prevention: string[];
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Index() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    setDiagnosis(null);
    const base64 = await fileToBase64(file);
    setPreview(base64);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-leaf", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDiagnosis(data.diagnosis);
      if (!data.diagnosis.is_plant) {
        toast.warning("This doesn't look like a plant leaf");
      } else {
        toast.success("Analysis complete");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => {
    setPreview(null);
    setDiagnosis(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const severityColor = (s: Diagnosis["severity"]) => {
    if (s === "severe") return "bg-destructive text-destructive-foreground";
    if (s === "moderate") return "bg-warning text-warning-foreground";
    if (s === "mild") return "bg-accent text-accent-foreground";
    return "bg-success text-success-foreground";
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-md bg-background/70 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-display text-xl font-bold">LeafLens</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Powered by AI Vision</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8 md:pt-20 md:pb-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Free & instant
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05]">
              Diagnose plant <span style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>diseases</span> in seconds
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Snap or upload a leaf photo. Our AI identifies the disease, severity, and gives you
              treatment steps — built for farmers, gardeners, and researchers.by asim
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-full px-7 h-12 shadow-[var(--shadow-glow)]"
                style={{ background: "var(--gradient-hero)" }}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="w-5 h-5 mr-2" />
                Upload a leaf
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7 h-12"
                onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })}
              >
                How it works
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-30 blur-3xl" style={{ background: "var(--gradient-hero)" }} />
            <img
              src={heroLeaf}
              alt="Fresh green leaf with dew drops"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-[var(--shadow-glow)] w-full h-auto object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* Analyzer */}
      <section id="analyzer" className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-card rounded-3xl shadow-[var(--shadow-card)] border border-border/60 p-6 md:p-10">
          {!preview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-12 md:p-20 text-center ${
                dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-secondary/40"
              }`}
            >
              <div
                className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-primary-foreground"
                style={{ background: "var(--gradient-hero)" }}
              >
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Drop a leaf photo here</h3>
              <p className="text-muted-foreground mb-1">or click to browse — JPG, PNG up to 8MB</p>
              <p className="text-xs text-muted-foreground">Tip: clear, well-lit close-ups work best</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2 relative">
                  <img src={preview} alt="Uploaded leaf" className="rounded-2xl w-full aspect-square object-cover shadow-[var(--shadow-card)]" />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-background shadow-md transition"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="md:w-1/2 flex items-center">
                  {loading ? (
                    <div className="w-full text-center space-y-4">
                      <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                      <p className="font-medium">Analyzing leaf…</p>
                      <p className="text-sm text-muted-foreground">Our AI is examining patterns, color & texture</p>
                    </div>
                  ) : diagnosis ? (
                    <DiagnosisCard diagnosis={diagnosis} severityColor={severityColor} />
                  ) : null}
                </div>
              </div>

              {diagnosis && !loading && (
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <InfoBlock title="Symptoms" items={diagnosis.symptoms} />
                  <InfoBlock title="Likely causes" items={diagnosis.causes} />
                  <InfoBlock title="Treatment" items={diagnosis.treatments} highlight />
                  <InfoBlock title="Prevention" items={diagnosis.prevention} />
                </div>
              )}

              {diagnosis && !loading && (
                <div className="flex justify-center pt-2">
                  <Button onClick={reset} variant="outline" className="rounded-full px-6">
                    Analyze another leaf
                  </Button>
                </div>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {[
            { n: "01", t: "Capture", d: "Take or upload a clear leaf photo" },
            { n: "02", t: "Analyze", d: "AI inspects color, texture & spots" },
            { n: "03", t: "Treat", d: "Get tailored treatment & prevention" },
          ].map((s) => (
            <div key={s.n} className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)]">
              <div className="text-xs font-mono text-primary mb-2">{s.n}</div>
              <h4 className="font-display text-xl font-bold mb-1">{s.t}</h4>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-sm text-muted-foreground">
        <p>LeafLens · AI guidance only — confirm critical decisions with an agronomist.</p>
      </footer>
    </div>
  );
}

function DiagnosisCard({ diagnosis, severityColor }: { diagnosis: Diagnosis; severityColor: (s: Diagnosis["severity"]) => string }) {
  if (!diagnosis.is_plant) {
    return (
      <div className="w-full text-center space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto text-warning" />
        <h3 className="font-display text-2xl font-bold">Not a leaf</h3>
        <p className="text-muted-foreground text-sm">Please upload a clear photo of a plant leaf for analysis.</p>
      </div>
    );
  }
  return (
    <div className="w-full space-y-4">
      <div className="flex items-start gap-3">
        {diagnosis.is_healthy ? (
          <CheckCircle2 className="w-8 h-8 text-success shrink-0 mt-1" />
        ) : (
          <AlertCircle className="w-8 h-8 text-warning shrink-0 mt-1" />
        )}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{diagnosis.plant_name}</p>
          <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight">{diagnosis.disease_name}</h3>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColor(diagnosis.severity)}`}>
          {diagnosis.severity === "none" ? "Healthy" : `${diagnosis.severity} severity`}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
          {Math.round(diagnosis.confidence)}% confidence
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${diagnosis.confidence}%`, background: "var(--gradient-hero)" }}
        />
      </div>
    </div>
  );
}

function InfoBlock({ title, items, highlight }: { title: string; items: string[]; highlight?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className={`rounded-2xl p-5 ${highlight ? "bg-primary/5 border border-primary/20" : "bg-secondary/50"}`}>
      <h4 className={`font-display font-bold mb-3 ${highlight ? "text-primary" : ""}`}>{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${highlight ? "bg-primary" : "bg-muted-foreground"}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
