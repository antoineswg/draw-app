import { useDrawingStore } from '../../store/useDrawingStore';

export function DrawToolbar() {
  const { strokeWidth, setStrokeWidth, strokeColor, setStrokeColor } = useDrawingStore();

  // épaisseurs disponibles en pixels
  const widthOptions = [2, 4, 8, 16];
  // palette de couleurs disponibles
  const colorOptions = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#ff0000' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#0000ff' },
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Orange', value: '#ff8800' },
    { name: 'Purple', value: '#8800ff' },
    { name: 'White', value: '#ffffff' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Stroke Width:</span>
        <div className="flex gap-3">
          {widthOptions.map((width) => (
            <label key={width} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="strokeWidth"
                value={width}
                checked={strokeWidth === width}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="radio radio-sm"
              />
              <span className="text-sm">{width}px</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Color:</span>
        <div className="flex gap-2">
          {colorOptions.map((color) => (
            <label key={color.value} className="cursor-pointer" title={color.name}>
              {/* input caché pour gérer la sélection */}
              <input
                type="radio"
                name="strokeColor"
                value={color.value}
                checked={strokeColor === color.value}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="sr-only"
              />
              {/* cercle coloré avec effet visuel sur la couleur active */}
              <div
                className={`w-8 h-8 rounded-full border-2 ${
                  strokeColor === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                } transition-all`}
                style={{ backgroundColor: color.value }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}