import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { MapPin, Users, CheckCircle, Award, Building2, Activity, Plus, Minus, LocateFixed } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { IDemographicRow, IHospital } from "@/types";

// ── Metric definitions ────────────────────────────────────────────
type MapMetric = "learners" | "completion" | "certification" | "hospitals" | "active_chws";

interface MetricConfig {
  key: MapMetric;
  label: string;
  description: string;
  unit: "%" | "count";
}

const MAP_METRICS: MetricConfig[] = [
  { key: "learners",      label: "Learners",      description: "Registered Learners",    unit: "count" },
  { key: "completion",    label: "Completion",    description: "Course Completion Rate", unit: "%"     },
  { key: "certification", label: "Certification", description: "Certification Rate",     unit: "%"     },
  { key: "hospitals",     label: "Hospitals",     description: "Health Facilities",      unit: "count" },
  { key: "active_chws",   label: "Active CHWs",   description: "Active CHWs",           unit: "count" },
];

type MetricIcon = React.FC<{ size?: number | string; className?: string }>;

const METRIC_ICONS: Record<MapMetric, MetricIcon> = {
  learners:      Users,
  completion:    CheckCircle,
  certification: Award,
  hospitals:     Building2,
  active_chws:   Activity,
};

// ── SVG Icons for D3 ───────────────────────────────────────────────
const BUILDING2_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
const ACTIVITY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;

// ── Component types ───────────────────────────────────────────────
interface RwandaDistrictMapProps {
  byDistrict: IDemographicRow[];
  activeDistrict: string;
  onDistrictClick: (district: string) => void;
  hospitals?: IHospital[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  district: string;
  total: number;
  completionRate: number;
  certificationRate: number;
  metricValue: number | null;
  hospitalCount: number;
  activeChwCount: number;
}

export const RwandaDistrictMap: React.FC<RwandaDistrictMapProps> = ({
  byDistrict,
  activeDistrict,
  onDistrictClick,
  hospitals = [],
}) => {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef      = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const prevMetricRef= useRef<MapMetric | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0,
    district: "", total: 0, completionRate: 0, certificationRate: 0,
    metricValue: null, hospitalCount: 0, activeChwCount: 0,
  });
  const [geoData,      setGeoData]      = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [activeMetric, setActiveMetric] = useState<MapMetric>("learners");
  const [isMapInit,    setIsMapInit]    = useState(false);

  // ── Constants & Projections ───────────────────────────────────
  const VW = 480;
  const VH = 346; // Original aspect ratio
  
  const projection = useMemo(() => d3.geoMercator().center([29.88, -1.945]).scale(9800).translate([VW / 2, VH / 2]), []);
  const pathGen    = useMemo(() => d3.geoPath().projection(projection), [projection]);

  // ── Data Fetching ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/rwanda-districts.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => { setGeoData(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  // ── Pre-process GeoData Once ──────────────────────────────────
  const processedGeoData = useMemo(() => {
    if (!geoData) return null;
    const reverseRings = (coords: number[][][]) => coords.map(ring => [...ring].reverse());
    const features = geoData.features.map((f: any) => {
       const geom = f.geometry.type === "Polygon" ? { ...f.geometry, coordinates: reverseRings(f.geometry.coordinates) } : f.geometry;
       const feature = { ...f, geometry: geom };
       feature.properties.centroid = pathGen.centroid(feature);
       feature.properties.area = pathGen.area(feature);
       return feature;
    });
    return { ...geoData, features } as GeoJSON.FeatureCollection;
  }, [geoData, pathGen]);

  // ── Aggregations ──────────────────────────────────────────────
  const districtDataMap = useMemo(() => {
    const map = new Map<string, IDemographicRow>();
    for (const row of byDistrict) {
      if (row.district) map.set(row.district, row);
    }
    return map;
  }, [byDistrict]);

  const hospitalsByDistrict = useMemo(() => {
    const map = new Map<string, { hospitals: number; activeChws: number }>();
    for (const h of hospitals) {
      if (!h.district) continue;
      const ex = map.get(h.district) ?? { hospitals: 0, activeChws: 0 };
      map.set(h.district, {
        hospitals:  ex.hospitals  + 1,
        activeChws: ex.activeChws + (h.activeChws ?? 0),
      });
    }
    return map;
  }, [hospitals]);

  const getMetricValue = useCallback((districtName: string): number | null => {
    const demo = districtDataMap.get(districtName);
    const hosp = hospitalsByDistrict.get(districtName);
    switch (activeMetric) {
      case "learners":      return demo?.total             ?? null;
      case "completion":    return demo?.completionRate    ?? null;
      case "certification": return demo?.certificationRate ?? null;
      case "hospitals":     return hosp?.hospitals         ?? null;
      case "active_chws":   return hosp?.activeChws        ?? null;
    }
  }, [activeMetric, districtDataMap, hospitalsByDistrict]);

  const metricDomain = useMemo((): [number, number] => {
    const config = MAP_METRICS.find(m => m.key === activeMetric)!;
    if (config.unit === "%") return [0, 100];
    const values: number[] = [];
    for (const name of districtDataMap.keys()) {
      const v = getMetricValue(name); if (v !== null) values.push(v);
    }
    for (const name of hospitalsByDistrict.keys()) {
      const v = getMetricValue(name); if (v !== null) values.push(v);
    }
    return [0, Math.max(...values, 1)];
  }, [activeMetric, getMetricValue, districtDataMap, hospitalsByDistrict]);

  const activeMetricConfig = MAP_METRICS.find(m => m.key === activeMetric)!;
  const legendMin = activeMetricConfig.unit === "%" ? "0%" : "0";
  const legendMax = activeMetricConfig.unit === "%" ? "100%" : Math.floor(metricDomain[1]).toLocaleString();
  const formatMetricValue = useCallback((value: number | null): string => {
    if (value === null) return "—";
    return activeMetricConfig.unit === "%" ? `${value}%` : value.toLocaleString();
  }, [activeMetricConfig.unit]);

  // ── D3 One-Time Initialization ─────────────────────────────────
  const initMap = useCallback(() => {
    if (!processedGeoData || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    if (!svg.select(".map-container").empty()) return; // Already initialized

    svg
      .attr("viewBox", `0 0 ${VW} ${VH}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("display", "block")
      .style("overflow", "hidden");
      
    svg.selectAll("*").remove();

    svg.append("rect").attr("width", VW).attr("height", VH).attr("fill", "#f8fafc");

    const g = svg.append("g").attr("class", "map-container");
    g.append("g").attr("class", "districts");
    g.append("g").attr("class", "district-markers");
    g.append("g").attr("class", "district-labels");

    // Mini Map Setup
    const mmWidth = 80;
    const mmHeight = 80;
    const mmMargin = 8;
    const minimapG = svg.append("g")
      .attr("class", "minimap")
      .attr("transform", `translate(${mmMargin}, ${VH - mmHeight - mmMargin})`);

    minimapG.append("rect")
      .attr("width", mmWidth).attr("height", mmHeight)
      .attr("fill", "white").attr("stroke", "#cbd5e1").attr("stroke-width", 1).attr("rx", 4);

    const mmProj = d3.geoMercator().center([29.88, -1.945]).scale(2200).translate([mmWidth / 2, mmHeight / 2]);
    const mmPathGen = d3.geoPath().projection(mmProj);

    minimapG.append("g").selectAll("path")
      .data(processedGeoData.features)
      .enter().append("path")
      .attr("d", (d: any) => mmPathGen(d) ?? "")
      .attr("fill", "#e2e8f0").attr("stroke", "white").attr("stroke-width", 0.5);

    minimapG.append("rect").attr("class", "view-rect")
      .attr("fill", "rgba(29, 78, 216, 0.1)").attr("stroke", "#1d4ed8").attr("stroke-width", 1);

    // Zoom Setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        
        // Keep labels fully visible regardless of zoom scale
        g.selectAll(".district-label").attr("opacity", 1);

        // Inverse scaling for markers
        g.selectAll(".marker-scaler").attr("transform", `scale(${1 / Math.sqrt(event.transform.k)})`);
        
        // Sync minimap
        const scale = event.transform.k;
        const x = -event.transform.x / scale;
        const y = -event.transform.y / scale;
        const w = VW / scale;
        const h = VH / scale;
        const ratio = 2200 / 9800; 
        
        let rx = mmWidth / 2 + (x - VW / 2) * ratio;
        let ry = mmHeight / 2 + (y - VH / 2) * ratio;
        let rw = w * ratio;
        let rh = h * ratio;

        rx = Math.max(0, Math.min(rx, mmWidth));
        ry = Math.max(0, Math.min(ry, mmHeight));
        rw = Math.min(rw, mmWidth - rx);
        rh = Math.min(rh, mmHeight - ry);

        minimapG.select(".view-rect")
          .attr("x", rx).attr("y", ry).attr("width", rw).attr("height", rh);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    setIsMapInit(true);
  }, [processedGeoData]);

  useEffect(() => { initMap(); }, [initMap]);

  // ── D3 Dynamic Update Lifecycle ────────────────────────────────
  useEffect(() => {
    if (!isMapInit || !processedGeoData || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select(".map-container");

    // 1. Data Enrichment
    const enrichedFeatures = processedGeoData.features.map((f: any) => {
      const val = getMetricValue(f.properties.shapeName);
      return {
        ...f,
        properties: {
          ...f.properties,
          val: val,
          hasData: val !== null && val > 0
        }
      };
    });

    const colorScale = d3.scaleSequential().domain(metricDomain).interpolator(d3.interpolate("#93c5fd", "#1e3a8a"));

    const activeFeatures = enrichedFeatures.filter((f: any) => f.properties.hasData);
    const hasAnyData = activeFeatures.length > 0;

    // 2. Update Paths
    const paths = g.select(".districts").selectAll("path").data(enrichedFeatures, (d: any) => d.properties.shapeName);

    const pathsEnter = paths.enter().append("path")
      .attr("d", (d: any) => pathGen(d) ?? "")
      .attr("cursor", "pointer")
      .attr("vector-effect", "non-scaling-stroke");

    const pathsMerge = pathsEnter.merge(paths as any);

    pathsMerge.transition().duration(500)
      .attr("fill", (d: any) => d.properties.hasData ? colorScale(d.properties.val) : "#e2e8f0")
      .attr("stroke", (d: any) => d.properties.shapeName === activeDistrict ? "#1d4ed8" : "#93c5fd")
      .attr("stroke-width", (d: any) => d.properties.shapeName === activeDistrict ? 2.5 : 1)
      .attr("opacity", (d: any) => {
        if (activeDistrict) return d.properties.shapeName === activeDistrict ? 1 : (d.properties.hasData ? 0.6 : 0.4);
        return !hasAnyData || d.properties.hasData ? 1 : 0.4;
      });

    // Event handlers (re-bound to capture latest closures)
    pathsMerge
      .on("mouseenter", function (event: MouseEvent, d: any) {
        const name = d.properties.shapeName;
        const row  = districtDataMap.get(name);
        const hosp = hospitalsByDistrict.get(name);
        const cr   = containerRef.current!.getBoundingClientRect();
        
        setTooltip({
          visible: true, x: event.clientX - cr.left, y: event.clientY - cr.top - 10,
          district: name, total: row?.total ?? 0, completionRate: row?.completionRate ?? 0,
          certificationRate: row?.certificationRate ?? 0, metricValue: d.properties.val,
          hospitalCount: hosp?.hospitals ?? 0, activeChwCount: hosp?.activeChws ?? 0,
        });

        d3.select(this).attr("stroke", "#fbbf24").attr("stroke-width", 3).raise();
      })
      .on("mousemove", function (event: MouseEvent) {
        const cr = containerRef.current!.getBoundingClientRect();
        setTooltip((p) => ({ ...p, x: event.clientX - cr.left, y: event.clientY - cr.top - 10 }));
      })
      .on("mouseleave", function (_event: MouseEvent, d: any) {
        setTooltip((p) => ({ ...p, visible: false }));
        d3.select(this).attr("stroke", d.properties.shapeName === activeDistrict ? "#1d4ed8" : "#93c5fd")
          .attr("stroke-width", d.properties.shapeName === activeDistrict ? 2.5 : 1);
      })
      .on("click", (_event: MouseEvent, d: any) => {
        onDistrictClick(d.properties.shapeName === activeDistrict ? "" : d.properties.shapeName);
      })
      .on("dblclick", function(event: MouseEvent, d: any) {
        event.stopPropagation(); 
        const bounds = pathGen.bounds(d);
        const [[x0, y0], [x1, y1]] = bounds;
        const dx = x1 - x0, dy = y1 - y0;
        const x = (x0 + x1) / 2, y = (y0 + y1) / 2;
        const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / VW, dy / VH)));
        const translate = [VW / 2 - scale * x, VH / 2 - scale * y];
        svg.transition().duration(750).call(zoomRef.current!.transform as any, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
      });

    // 3. Update Labels
    const labels = g.select(".district-labels").selectAll("text.district-label").data(enrichedFeatures, (d: any) => d.properties.shapeName);

    const labelsEnter = labels.enter().append("text")
      .attr("class", "district-label")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("pointer-events", "none");

    const labelsMerge = labelsEnter.merge(labels as any);

    labelsMerge.each(function(d: any) {
      const textNode = d3.select(this);
      textNode.selectAll("*").remove();

      if (!d.properties.centroid || isNaN(d.properties.centroid[0])) return;

      textNode.append("tspan")
        .attr("x", d.properties.centroid[0])
        .attr("y", d.properties.centroid[1] - (d.properties.hasData ? 3 : 0))
        .attr("font-size", "5px")
        .attr("font-weight", "600")
        .attr("fill", "#1e293b")
        .attr("paint-order", "stroke")
        .attr("stroke", "white")
        .attr("stroke-width", "1.5px")
        .attr("stroke-linejoin", "round")
        .text(d.properties.shapeName);

      if (d.properties.hasData) {
        textNode.append("tspan")
          .attr("x", d.properties.centroid[0])
          .attr("y", d.properties.centroid[1] + 4)
          .attr("font-size", "4px")
          .attr("font-weight", "500")
          .attr("fill", "#334155")
          .attr("paint-order", "stroke")
          .attr("stroke", "white")
          .attr("stroke-width", "1px")
          .attr("stroke-linejoin", "round")
          .text(formatMetricValue(d.properties.val));
      }
    });

    labelsMerge.attr("opacity", 1);

    const currentTransform = d3.zoomTransform(svg.node()!);

    // 4. Update Markers
    const isMarkerMetric = activeMetric === "hospitals" || activeMetric === "active_chws";
    const markerData = isMarkerMetric ? enrichedFeatures.filter((f: any) => f.properties.hasData) : [];

    const markers = g.select(".district-markers").selectAll("g.district-marker").data(markerData, (d: any) => d.properties.shapeName);

    markers.exit().transition().duration(300).attr("opacity", 0).remove();

    const markersEnter = markers.enter().append("g")
      .attr("class", "district-marker")
      .style("pointer-events", "none")
      .attr("transform", (d: any) => `translate(${d.properties.centroid[0]}, ${d.properties.centroid[1]})`)
      .attr("opacity", 0);

    const scalersEnter = markersEnter.append("g").attr("class", "marker-scaler");
    scalersEnter.append("circle").attr("class", "pulse").attr("fill", "#1d4ed8").attr("opacity", 0.15);
    scalersEnter.append("circle").attr("class", "bg").attr("fill", "white").attr("stroke", "#1d4ed8").attr("stroke-width", 1).style("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.15))");
    scalersEnter.append("g").attr("class", "icon").attr("transform", "translate(-5, -5)").attr("color", "#1d4ed8");
    const badgeEnter = scalersEnter.append("g").attr("class", "badge");
    badgeEnter.append("circle").attr("fill", "#ef4444").attr("stroke", "white").attr("stroke-width", 0.5);
    badgeEnter.append("text").attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("font-size", "4.5px").attr("font-weight", "700").attr("fill", "white");

    const markersMerge = markersEnter.merge(markers as any);
    markersMerge.transition().duration(300).attr("opacity", 1);

    markersMerge.each(function(d: any) {
      const radius = Math.min(16, 5 + Math.sqrt(d.properties.val) * 2.5);
      const scaler = d3.select(this).select(".marker-scaler");
      
      scaler.attr("transform", `scale(${1 / Math.sqrt(currentTransform.k || 1)})`);
      scaler.select(".pulse").transition().duration(500).attr("r", radius + 6);
      scaler.select(".bg").transition().duration(500).attr("r", radius);
      scaler.select(".icon").html(activeMetric === "hospitals" ? BUILDING2_SVG : ACTIVITY_SVG);
      
      const badge = scaler.select(".badge").attr("transform", `translate(${radius - 3}, -${radius - 2})`);
      badge.select("circle").attr("r", 4.5);
      badge.select("text").text(d.properties.val > 99 ? "99+" : d.properties.val.toString());
    });

    // 5. Automatic Fit-To-Bounds Zoom (Only triggers when filter changes)
    if (prevMetricRef.current !== activeMetric) {
      const isInitial = prevMetricRef.current === null;
      prevMetricRef.current = activeMetric;

      const zoom = zoomRef.current;
      if (zoom && !isInitial) {
        if (activeFeatures.length > 0 && activeFeatures.length < enrichedFeatures.length) {
          const activeCollection = { type: "FeatureCollection", features: activeFeatures } as GeoJSON.FeatureCollection;
          const bounds = pathGen.bounds(activeCollection);
          const [[x0, y0], [x1, y1]] = bounds;
          const dx = x1 - x0, dy = y1 - y0;
          const x = (x0 + x1) / 2, y = (y0 + y1) / 2;
          
          const scale = Math.max(1, Math.min(8, 0.70 / Math.max(dx / VW, dy / VH)));
          const translate = [VW / 2 - scale * x, VH / 2 - scale * y];

          svg.transition().duration(1000).call(
            zoom.transform as any,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
          );
        } else {
          // Clear all or full country -> smooth transition out to default
          svg.transition().duration(1000).call(
            zoom.transform as any,
            d3.zoomIdentity
          );
        }
      }
    }
  }, [isMapInit, processedGeoData, districtDataMap, hospitalsByDistrict, activeMetric, activeDistrict, metricDomain, onDistrictClick, formatMetricValue, pathGen]);


  // ── Manual Navigation Controls ────────────────────────────────
  const handleRecenter = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform as any, d3.zoomIdentity);
    }
  };

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.66);
    }
  };

  return (
    <Card padding={false} className="overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <DashboardSectionHeader icon={<MapPin size={16} />} title="Service Coverage Map" />
        <div className="mt-2 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {MAP_METRICS.map((metric) => {
            const Icon    = METRIC_ICONS[metric.key];
            const isActive = activeMetric === metric.key;
            return (
              <button
                key={metric.key}
                onClick={() => setActiveMetric(metric.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border shrink-0 ${isActive ? "bg-[#3363AD] text-white border-[#3363AD] shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-[#3363AD] hover:text-[#3363AD]"}`}
              >
                <Icon size={11} />
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-40 h-40 bg-gray-100 rounded-full animate-pulse" />
        </div>
      ) : !geoData ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">Failed to load map</div>
      ) : (
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-b-xl">
          <svg
            ref={svgRef}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              minHeight: "400px",
            }}
          />

          <div className="absolute bottom-4 right-4 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden z-10">
            <button onClick={handleRecenter} className="p-2 hover:bg-gray-50 text-gray-600 border-b border-gray-100 transition-colors" title="Recenter Map">
              <LocateFixed size={16} />
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-50 text-gray-600 border-b border-gray-100 transition-colors" aria-label="Zoom in">
              <Plus size={16} />
            </button>
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-50 text-gray-600 transition-colors" aria-label="Zoom out">
              <Minus size={16} />
            </button>
          </div>

          {tooltip.visible && (
            <div className="absolute pointer-events-none z-20 bg-white border border-gray-200 rounded-lg shadow-xl px-3 py-2.5 text-xs min-w-[168px] transition-opacity duration-100" style={{ left: tooltip.x + 12, top: tooltip.y }}>
              <p className="font-bold text-gray-900 text-[13px] mb-2">{tooltip.district} Deep Dive</p>
              <div className="space-y-1">
                {activeMetric !== "learners" && (
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-gray-500">Learners</span>
                    <span className="font-semibold text-gray-700">{tooltip.total.toLocaleString()}</span>
                  </div>
                )}
                {activeMetric !== "completion" && (
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-gray-500">Completion</span>
                    <span className={`font-semibold ${tooltip.completionRate >= 60 ? "text-green-600" : tooltip.completionRate >= 30 ? "text-amber-600" : "text-red-500"}`}>{tooltip.completionRate}%</span>
                  </div>
                )}
                {activeMetric !== "certification" && (
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-gray-500">Certification</span>
                    <span className="font-semibold text-[#3363AD]">{tooltip.certificationRate}%</span>
                  </div>
                )}
                {activeMetric !== "hospitals" && tooltip.hospitalCount > 0 && (
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-gray-500">Facilities</span>
                    <span className="font-semibold text-gray-700">{tooltip.hospitalCount}</span>
                  </div>
                )}
                {activeMetric !== "active_chws" && tooltip.activeChwCount > 0 && (
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-gray-500">Active CHWs</span>
                    <span className="font-semibold text-gray-700">{tooltip.activeChwCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-4 pt-2 pb-1 bg-white">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-medium text-gray-600 shrink-0 w-28">{activeMetricConfig.description}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "linear-gradient(to right, #bfdbfe, #1e3a8a)" }} />
              <span className="text-xs font-bold text-[#1e3a8a] shrink-0 text-right">{legendMin} — {legendMax}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] opacity-40 shrink-0" />
              <span className="text-xs text-gray-400">No data (Dimmed)</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pb-2 bg-white text-[10px] text-gray-400">
            <span>Last Updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>Map: geoBoundaries (CC BY 4.0)</span>
          </div>
        </div>
      )}
    </Card>
  );
};
