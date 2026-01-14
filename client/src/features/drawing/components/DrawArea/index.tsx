import { useCallback, useEffect, useMemo, useRef } from "react";
import { getCoordinatesRelativeToElement } from "../../utils/getCanvasCoordinates";
import { useMyUserStore } from "../../../user/store/useMyUserStore";
import { SocketManager } from "../../../../shared/services/SocketManager";
import { useDrawingStore } from "../../store/useDrawingStore";
import { useUserListStore } from "../../../user/store/useUserListStore";
import styles from './DrawArea.module.css';

/**
 * EN SAVOIR PLUS : 
 * DPR : https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
 * ResizeObserver : https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */

export function DrawArea() {
  /**
   * ===================
   * ETATS & REFS (toujours les définir en haut du composant)
   * ===================
   * 
  */
   
  /**
   * Rappel : Les modifications de state impliquent un re-render alors que les ref ne provoquent AUCUN re-render (c'est pour ça qu'on ne les ajoute pas dans les dépendances d'un hook par exemple)
   * 
  */ 

  /**
   * On utilise des refs ici, car on ne veut surtout pas provoquer de re-render à chaque fois qu'on a une modification de tracé
   * Ici, on va donc pouvoir stocker les informations dont on a besoin, sans provoquer aucun re-rendu
  */
  const canvasRef = useRef<HTMLCanvasElement>(null); /** Les updates sur ces constantes ne provoqueront pas re-render */
  const parentRef = useRef<HTMLDivElement>(null); /** Les updates sur ces constantes ne provoqueront pas re-render */
  const isDrawingRef = useRef<boolean>(false); /** Pour savoir si on est en train de dessiner */
  const lastPointRef = useRef<{ x: number; y: number } | null>(null); /** Pour stocker le dernier point */
  const currentStrokePointsRef = useRef<{ x: number; y: number }[]>([]); /** Pour stocker les points du tracé en cours */
  const currentStrokeWidthRef = useRef<number>(2); /** Pour stocker la largeur du tracé en cours */
  const currentStrokeColorRef = useRef<string>('#000000'); /** Pour stocker la couleur du tracé en cours */
  const otherUsersLastPointRef = useRef<Map<string, { x: number; y: number; width: number; color: string }>>(new Map());
  const resizeTimerRef = useRef<number | null>(null);

  const { myUser } = useMyUserStore();
  const { strokeWidth, strokeColor, setExportCanvas } = useDrawingStore();
  const canUserDraw = useMemo(() => myUser !== null, [myUser]); 
  
  /**
   * ===================
   * GESTION COORDONNEES
   * ===================
   */

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    return getCoordinatesRelativeToElement(e.clientX, e.clientY, canvasRef.current);
  }

  const absoluteToRelative = useCallback((x: number, y: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: x / rect.width,
      y: y / rect.height
    };
  }, []);

  const relativeToAbsolute = useCallback((x: number, y: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: x * rect.width,
      y: y * rect.height
    };
  }, []); 

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  }, []);

  const drawLine = useCallback((startX: number, startY: number, endX: number, endY: number, width?: number, color?: string) => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color ?? strokeColor;
    ctx.lineWidth = width ?? strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [strokeWidth, strokeColor]);

  const redrawAllStrokes = useCallback((strokes: Array<{ points: Array<{ x: number; y: number }>; strokeWidth: number; color: string }>) => {
    clearCanvas();
    strokes.forEach(stroke => {
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const start = relativeToAbsolute(stroke.points[i].x, stroke.points[i].y);
        const end = relativeToAbsolute(stroke.points[i + 1].x, stroke.points[i + 1].y);
        drawLine(start.x, start.y, end.x, end.y, stroke.strokeWidth, stroke.color);
      }
    });
  }, [clearCanvas, relativeToAbsolute, drawLine]);

  const fetchStrokes = useCallback(async () => {
    const response = await SocketManager.get('strokes');
    if (response?.strokes) {
      redrawAllStrokes(response.strokes as Array<{ points: Array<{ x: number; y: number }>; strokeWidth: number; color: string }>);
    }
  }, [redrawAllStrokes]);

  // export du canvas en PNG avec fond blanc
  const exportCanvasToPNG = useCallback(() => {
    if (!canvasRef.current) return;
    // création d'un canvas temporaire
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    // remplissage du fond en blanc
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    // copie du canvas original par-dessus
    tempCtx.drawImage(canvasRef.current, 0, 0);
    // conversion en data URL
    const dataURL = tempCanvas.toDataURL('image/png');
    // création d'un lien de téléchargement
    const link = document.createElement('a');
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    link.download = `drawappCanvasExport-${day}${month}${year}_${hours}${minutes}${seconds}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  /**
   * ===================
   * GESTION DES EVENEMENTS MOUSE
   * ===================
   */
  
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (lastPointRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const startX = lastPointRef.current.x;
        const startY = lastPointRef.current.y;
        const width = currentStrokeWidthRef.current;
        const color = currentStrokeColorRef.current;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    currentStrokePointsRef.current.push({ x, y });

    const relativeCoords = absoluteToRelative(x, y);
    SocketManager.emit('draw:move', { x: relativeCoords.x, y: relativeCoords.y });

    lastPointRef.current = { x, y };
  }, [absoluteToRelative]);

  const onMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !canvasRef.current) return;

    if (lastPointRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const { x, y } = lastPointRef.current;
        const width = currentStrokeWidthRef.current;
        const color = currentStrokeColorRef.current;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 0.1, y + 0.1);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    SocketManager.emit('draw:end', {});

    isDrawingRef.current = false;
    lastPointRef.current = null;
    currentStrokePointsRef.current = [];

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
    }
  }, []);

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback((e) => {
    /** On empêche à l'utilisateur de dessiner tant qu'il n'a pas rejoint le serveur  */
    if (!canUserDraw) { return; }

    /** Récupération du contexte 2d du canvas */
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    /** Transformation des coordoonées mouse (relatives à la page) vers des coordonnées relative au canvas  */
    const coordinates = getCanvasCoordinates(e);

    const relativeCoords = absoluteToRelative(coordinates.x, coordinates.y);
    SocketManager.emit('draw:start', { x: relativeCoords.x, y: relativeCoords.y, color: strokeColor, strokeWidth });

    // enregistre la couleur de l'utilisateur local
    if (myUser?.id) {
      useUserListStore.getState().setUserStrokeColor(myUser.id, strokeColor);
    }

    isDrawingRef.current = true;
    lastPointRef.current = { x: coordinates.x, y: coordinates.y };
    currentStrokePointsRef.current = [{ x: coordinates.x, y: coordinates.y }];
    currentStrokeWidthRef.current = strokeWidth;
    currentStrokeColorRef.current = strokeColor;

    ctx.beginPath();
    ctx.moveTo(coordinates.x, coordinates.y);
    ctx.lineTo(coordinates.x, coordinates.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    /**
    * On pourrait ajouter le onMouseMove, onMouseUp directement dans le JSX de notre canvas, mais les ajouter à la volée ici est plus flexible. On pourra retirer ces events onMouseUp
    * Cela évite aussi les re-render inutile
    */
    canvasRef.current?.addEventListener('mousemove', onMouseMove);
    canvasRef.current?.addEventListener('mouseup', onMouseUp);
  }, [canUserDraw, getCanvasCoordinates, absoluteToRelative, strokeWidth, strokeColor]);

  /**
   * ===================
   * GESTION DES DPR
   * ===================
   */

  /**
   * setCanvasDimensions : Configure les dimensions du canvas avec DPR
   */
  const setCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !parentRef.current) return;

    /** On va utiliser le ratio de pixel de l'écran pour avoir un rendu net  (DPR = 3|2|1) et par défaut on sera toujours à 1 */
    const dpr = window.devicePixelRatio || 1;

    /** On définit la taille réelle interne du canvas en se basant sur les DPR  */
    const parentWidth = parentRef.current?.clientWidth;
    const canvasWidth = parentWidth; /** On veut remplir 100% de la largeur de l'élément parent */
    const canvasHeight = Math.round(parentWidth * 9 / 16); /** On veut un ratio 16/9 par rapport à la largeur */

    canvasRef.current.width = dpr * canvasWidth; /** On multiplie la largeur souhaitée par le nb de dpr */
    canvasRef.current.height = dpr * canvasHeight; /** On multiplie la hauteur souhaitée par le nb de dpr */

    /**  On définit ensuite la taille en CSS, visible par l'utilisateur  */
    
    parentRef.current.style.setProperty('--canvas-width', `${canvasWidth}px`);
    parentRef.current.style.setProperty('--canvas-height', `${canvasHeight}px`);

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      /** On scale en prenant compte les dpr */
      ctx.scale(dpr, dpr); 
    }
  }, []);

  /**
   * ===================
   * GESTION DU RESIZE
   * ===================
  */

  useEffect(() => {
    fetchStrokes();
  }, [fetchStrokes]);

  useEffect(() => {
    // enregistrement de la fonction d'export dans le store
    setExportCanvas(exportCanvasToPNG);
    return () => setExportCanvas(() => {});
  }, [exportCanvasToPNG, setExportCanvas]);

  useEffect(() => {
    const handleServerDrawStart = (payload: unknown) => {
      const data = payload as { userId: string; x: number; y: number; strokeWidth: number; color: string };
      if (data.userId === myUser?.id) return;
      const absoluteCoords = relativeToAbsolute(data.x, data.y);
      otherUsersLastPointRef.current.set(data.userId, { x: absoluteCoords.x, y: absoluteCoords.y, width: data.strokeWidth || 2, color: data.color || '#000000' });
      // marque l'utilisateur comme dessinant
      useUserListStore.getState().setUserDrawing(data.userId, true);
      // enregistre la couleur de tracé de l'utilisateur
      useUserListStore.getState().setUserStrokeColor(data.userId, data.color || '#000000');
    };

    const handleServerDrawMove = (payload: unknown) => {
      const data = payload as { userId: string; x: number; y: number };
      if (data.userId === myUser?.id) return;
      const absoluteCoords = relativeToAbsolute(data.x, data.y);
      const lastPoint = otherUsersLastPointRef.current.get(data.userId);
      if (lastPoint && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(absoluteCoords.x, absoluteCoords.y);
          ctx.strokeStyle = lastPoint.color;
          ctx.lineWidth = lastPoint.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
      otherUsersLastPointRef.current.set(data.userId, { x: absoluteCoords.x, y: absoluteCoords.y, width: lastPoint?.width || 2, color: lastPoint?.color || '#000000' });
    };

    const handleServerDrawEnd = (payload: unknown) => {
      const data = payload as { userId: string };
      if (data.userId === myUser?.id) return;
      
      const lastPoint = otherUsersLastPointRef.current.get(data.userId);
      if (lastPoint && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(lastPoint.x + 0.1, lastPoint.y + 0.1);
          ctx.strokeStyle = lastPoint.color;
          ctx.lineWidth = lastPoint.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
      
      otherUsersLastPointRef.current.delete(data.userId);
      // marque l'utilisateur comme ne dessinant plus
      useUserListStore.getState().setUserDrawing(data.userId, false);
    };

    const handleServerClearCanvas = () => {
      clearCanvas();
    };

    SocketManager.listen('server:draw:start', handleServerDrawStart);
    SocketManager.listen('server:draw:move', handleServerDrawMove);
    SocketManager.listen('server:draw:end', handleServerDrawEnd);
    SocketManager.listen('server:clear:canvas', handleServerClearCanvas);

    return () => {
      SocketManager.off('server:draw:start', handleServerDrawStart);
      SocketManager.off('server:draw:move', handleServerDrawMove);
      SocketManager.off('server:draw:end', handleServerDrawEnd);
      SocketManager.off('server:clear:canvas', handleServerClearCanvas);
    };
  }, [myUser?.id, relativeToAbsolute, clearCanvas]);

  useEffect(() => {
    /**
     * On souhaite redimensionner le canvas et recharger les strokes au resize
     */
    const resizeObserver = new ResizeObserver(() => {
      setCanvasDimensions();
      
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      
      resizeTimerRef.current = setTimeout(() => {
        fetchStrokes();
      }, 300);
    });
    
    /** On observe les changements de taille sur l'élément parent */
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    /** 
     * Rappel : Il s'agit d'une fonction de cleanup (dans le useEffect le cleanup est optionnel). A chaque fois qu'un re-rendu est effectué, le cleanup est d'abord effectué avant de re ré-effectuer le useEffect classique. Elle est également appelée lorsque le component est removed du DOM. 
     */
    return () => {
      /** On veut disconnect pour éviter d'avoir plusieurs resizeObservers ou d'avoir un resizeObserver sur un élément qui n'existe plus  */
      resizeObserver.disconnect();
      
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };

  }, [setCanvasDimensions, fetchStrokes]);

  return (
    <div className={[styles.drawArea, 'w-full', 'h-full', 'overflow-hidden', 'flex', 'items-center'].join(' ')} ref={parentRef}>
      <canvas className={[styles.drawArea__canvas, 'border-1'].join(' ')} onMouseDown={onMouseDown} ref={canvasRef}
      >
      </canvas>
    </div>
  )
}