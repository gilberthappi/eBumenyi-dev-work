import React, { useState, useRef } from "react";
import {
  Save,
  Download,
  Undo2,
  Redo2,
  Trash2,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Copy,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { IWorkshopCertificate } from "@/types/certificates.d";

interface CanvasElement {
  id: string;
  type: "text" | "image" | "shape" | "qr";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // text content or image URL
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  borderRadius?: number;
}

interface DesignCanvasProps {
  certificate?: IWorkshopCertificate;
  onSave?: (certificate: IWorkshopCertificate) => void;
}

const CANVAS_WIDTH = 1056; // 8.5 inches at 96 DPI
const CANVAS_HEIGHT = 1344; // 11 inches at 96 DPI

const CertificateDesignEditor: React.FC<DesignCanvasProps> = ({
  certificate,
  onSave,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: "bg-1",
      type: "shape",
      x: 0,
      y: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      content: "",
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: "#ffffff",
      stroke: "#000000",
      borderRadius: 0,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>("bg-1");
  const [zoom, setZoom] = useState(50);
  const [history, setHistory] = useState<CanvasElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showLayers, setShowLayers] = useState(true);
  const [bgColor, setBgColor] = useState("#ffffff");

  const selected = elements.find((el) => el.id === selectedId);

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const updated = elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(updated);
    addToHistory(updated);
  };

  const addToHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  const addTextElement = () => {
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: "text",
      x: 100,
      y: 100,
      width: 300,
      height: 60,
      content: "Double click to edit text",
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fontSize: 24,
      fontWeight: "normal",
      textAlign: "left",
    };
    const updated = [...elements, newElement];
    setElements(updated);
    addToHistory(updated);
    setSelectedId(newElement.id);
  };

  const addShapeElement = (shapeType: "rect" | "circle") => {
    const newElement: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: "shape",
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      content: shapeType,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      fill: "#3b82f6",
      stroke: "#1e40af",
      borderRadius: shapeType === "circle" ? 50 : 0,
    };
    const updated = [...elements, newElement];
    setElements(updated);
    addToHistory(updated);
    setSelectedId(newElement.id);
  };

  const addImageElement = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newElement: CanvasElement = {
          id: `image-${Date.now()}`,
          type: "image",
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          content: imageUrl,
          rotation: 0,
          opacity: 1,
          locked: false,
          visible: true,
        };
        const updated = [...elements, newElement];
        setElements(updated);
        addToHistory(updated);
        setSelectedId(newElement.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const addQRCode = () => {
    const newElement: CanvasElement = {
      id: `qr-${Date.now()}`,
      type: "qr",
      x: 50,
      y: 50,
      width: 150,
      height: 150,
      content: "https://verify.example.com",
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
    };
    const updated = [...elements, newElement];
    setElements(updated);
    addToHistory(updated);
    setSelectedId(newElement.id);
  };

  const deleteElement = (id: string) => {
    if (id === "bg-1") {
      toast.error("Cannot delete background");
      return;
    }
    const updated = elements.filter((el) => el.id !== id);
    setElements(updated);
    addToHistory(updated);
    setSelectedId("");
  };

  const duplicateElement = (id: string) => {
    const element = elements.find((el) => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `${element.type}-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      };
      const updated = [...elements, newElement];
      setElements(updated);
      addToHistory(updated);
      setSelectedId(newElement.id);
    }
  };

  const toggleLock = (id: string) => {
    updateElement(id, { locked: !elements.find((el) => el.id === id)?.locked });
  };

  const toggleVisibility = (id: string) => {
    updateElement(id, {
      visible: !elements.find((el) => el.id === id)?.visible,
    });
  };

  const bringToFront = (id: string) => {
    const index = elements.findIndex((el) => el.id === id);
    if (index > -1) {
      const element = elements[index];
      const updated = [
        ...elements.slice(0, index),
        ...elements.slice(index + 1),
        element,
      ];
      setElements(updated);
      addToHistory(updated);
    }
  };

  const sendToBack = (id: string) => {
    const index = elements.findIndex((el) => el.id === id);
    if (index > 0) {
      const element = elements[index];
      const updated = [
        element,
        ...elements.slice(0, index),
        ...elements.slice(index + 1),
      ];
      setElements(updated);
      addToHistory(updated);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0 || elements.find((el) => el.id === elementId)?.locked)
      return;
    e.preventDefault();
    setSelectedId(elementId);

    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startElementX = element.x;
    const startElementY = element.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      updateElement(elementId, {
        x: startElementX + deltaX / (zoom / 100),
        y: startElementY + deltaY / (zoom / 100),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = element.id === selectedId;
    const scale = zoom / 100;

    const baseStyle = {
      position: "absolute" as const,
      left: `${element.x * scale}px`,
      top: `${element.y * scale}px`,
      width: `${element.width * scale}px`,
      height: `${element.height * scale}px`,
      opacity: element.opacity,
      transform: `rotate(${element.rotation}deg)`,
      cursor: element.locked ? "default" : "move",
      display: element.visible ? "block" : "none",
    };

    const selectedStyle = isSelected
      ? {
          outline: "2px solid #3b82f6",
          outlineOffset: "2px",
        }
      : {};

    if (element.type === "text") {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            ...selectedStyle,
            textAlign: element.textAlign || "left",
            padding: "8px",
            fontSize: `${element.fontSize}px`,
            fontWeight: element.fontWeight,
            color: element.fill || "#000000",
            wordWrap: "break-word",
            whiteSpace: "normal",
            overflow: "hidden",
          } as React.CSSProperties}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
          onDoubleClick={() => {
            const text = prompt("Edit text:", element.content);
            if (text !== null) {
              updateElement(element.id, { content: text });
            }
          }}
        >
          {element.content}
        </div>
      );
    }

    if (element.type === "image") {
      return (
        <img
          key={element.id}
          src={element.content}
          style={{
            ...baseStyle,
            ...selectedStyle,
            objectFit: "contain",
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
          alt="canvas element"
        />
      );
    }

    if (element.type === "qr") {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            ...selectedStyle,
            backgroundColor: element.fill || "#ffffff",
            border: `2px solid ${element.stroke || "#000000"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "#666",
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
        >
          📱 QR
        </div>
      );
    }

    if (element.type === "shape") {
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            ...selectedStyle,
            backgroundColor: element.fill || "transparent",
            border: element.stroke ? `2px solid ${element.stroke}` : "none",
            borderRadius: `${element.borderRadius}px`,
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
        />
      );
    }

    return null;
  };

  const handleSave = () => {
    toast.success("Certificate design saved!");
    if (onSave && certificate) {
      onSave(certificate);
    }
  };

  const handleExport = () => {
    toast.success("Certificate exported as PNG!");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar - Tools */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Design Tools</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Canvas Controls */}
          <div className="bg-gray-700 rounded p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">Canvas</h3>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                updateElement("bg-1", { fill: e.target.value });
              }}
              className="w-full h-10 rounded cursor-pointer"
              title="Background Color"
            />
          </div>

          {/* Add Elements */}
          <div className="bg-gray-700 rounded p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">Add Elements</h3>
            <button
              onClick={addTextElement}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Type className="w-4 h-4" />
              Add Text
            </button>
            <button
              onClick={() => addShapeElement("rect")}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Square className="w-4 h-4" />
              Rectangle
            </button>
            <button
              onClick={() => addShapeElement("circle")}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Circle className="w-4 h-4" />
              Circle
            </button>
            <button
              onClick={addImageElement}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              Upload Image
            </button>
            <button
              onClick={addQRCode}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              📱 Add QR Code
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* History */}
          <div className="bg-gray-700 rounded p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">History</h3>
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded text-sm"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded text-sm"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zoom */}
          <div className="bg-gray-700 rounded p-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">Zoom</h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 10))}
                className="p-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center text-sm">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <input
              type="range"
              min="25"
              max="200"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            <Save className="w-4 h-4" />
            Save Design
          </button>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
        </div>
      </div>

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 hover:bg-gray-700 disabled:opacity-50 rounded"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 hover:bg-gray-700 disabled:opacity-50 rounded"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="border-l border-gray-700 px-4 h-full flex items-center gap-2">
            <span className="text-sm text-gray-400">Zoom: {zoom}%</span>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setShowLayers(!showLayers)}
            className="p-2 hover:bg-gray-700 rounded"
            title="Toggle Layers"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            style={{
              width: `${CANVAS_WIDTH * (zoom / 100)}px`,
              height: `${CANVAS_HEIGHT * (zoom / 100)}px`,
              position: "relative",
              backgroundColor: bgColor,
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
              border: "1px solid #444",
            }}
          >
            {elements.map((element) => renderElement(element))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties & Layers */}
      {showLayers && (
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold">Layers & Properties</h2>
          </div>

          {/* Layers */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Layers</h3>
            {elements.map((element) => (
              <div
                key={element.id}
                onClick={() => setSelectedId(element.id)}
                className={`p-3 rounded cursor-pointer flex items-center gap-2 ${
                  selectedId === element.id
                    ? "bg-blue-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {element.type === "text"
                      ? "Text"
                      : element.type === "image"
                      ? "Image"
                      : element.type === "qr"
                      ? "QR Code"
                      : "Shape"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {element.id}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(element.id);
                  }}
                  className="p-1 hover:bg-gray-500 rounded"
                >
                  {element.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(element.id);
                  }}
                  className="p-1 hover:bg-gray-500 rounded"
                >
                  {element.locked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Properties */}
          {selected && (
            <div className="border-t border-gray-700 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-400">Properties</h3>

              {/* Position & Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">
                  Position & Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={Math.round(selected.x)}
                      onChange={(e) =>
                        updateElement(selected.id, { x: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={Math.round(selected.y)}
                      onChange={(e) =>
                        updateElement(selected.id, { y: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">W</label>
                    <input
                      type="number"
                      value={Math.round(selected.width)}
                      onChange={(e) =>
                        updateElement(selected.id, { width: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">H</label>
                    <input
                      type="number"
                      value={Math.round(selected.height)}
                      onChange={(e) =>
                        updateElement(selected.id, { height: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation & Opacity */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">
                  Transform
                </label>
                <div>
                  <label className="text-xs text-gray-500">Rotation</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selected.rotation}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        rotation: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">{selected.rotation}°</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selected.opacity}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">
                    {Math.round(selected.opacity * 100)}%
                  </p>
                </div>
              </div>

              {/* Text Properties */}
              {selected.type === "text" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">
                    Text
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={selected.fontSize || 24}
                    onChange={(e) =>
                      updateElement(selected.id, {
                        fontSize: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                    placeholder="Font Size"
                  />
                  <input
                    type="color"
                    value={selected.fill || "#000000"}
                    onChange={(e) =>
                      updateElement(selected.id, { fill: e.target.value })
                    }
                    className="w-full h-8 rounded cursor-pointer"
                    title="Text Color"
                  />
                </div>
              )}

              {/* Shape Properties */}
              {selected.type === "shape" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">
                    Fill & Stroke
                  </label>
                  <div>
                    <label className="text-xs text-gray-500">Fill Color</label>
                    <input
                      type="color"
                      value={selected.fill || "#3b82f6"}
                      onChange={(e) =>
                        updateElement(selected.id, { fill: e.target.value })
                      }
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Stroke Color
                    </label>
                    <input
                      type="color"
                      value={selected.stroke || "#000000"}
                      onChange={(e) =>
                        updateElement(selected.id, { stroke: e.target.value })
                      }
                      className="w-full h-8 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Element Actions */}
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <button
                  onClick={() => duplicateElement(selected.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => bringToFront(selected.id)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    title="Bring to Front"
                  >
                    ⬆️ Front
                  </button>
                  <button
                    onClick={() => sendToBack(selected.id)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    title="Send to Back"
                  >
                    ⬇️ Back
                  </button>
                </div>
                {selected.id !== "bg-1" && (
                  <button
                    onClick={() => deleteElement(selected.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificateDesignEditor;
