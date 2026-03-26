import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";

type FloatingFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

type FloatingBoardWindowProps = {
  initialFrame: FloatingFrame;
  viewportSize: ViewportSize;
  toolbar: ReactNode;
  children: ReactNode;
};

function clampFrame(frame: FloatingFrame, viewportSize: ViewportSize): FloatingFrame {
  const margin = 18;
  const topOffset = 96;
  const width = Math.min(Math.max(frame.width, 420), Math.max(420, viewportSize.width - margin * 2));
  const height = Math.min(Math.max(frame.height, 360), Math.max(360, viewportSize.height - topOffset - margin));

  return {
    x: Math.min(Math.max(frame.x, margin), Math.max(margin, viewportSize.width - width - margin)),
    y: Math.min(Math.max(frame.y, topOffset), Math.max(topOffset, viewportSize.height - height - margin)),
    width,
    height,
  };
}

export function FloatingBoardWindow({ initialFrame, viewportSize, toolbar, children }: FloatingBoardWindowProps) {
  const [frame, setFrame] = useState(() => clampFrame(initialFrame, viewportSize));
  const rndRef = useRef<Rnd | null>(null);

  useEffect(() => {
    setFrame((current) => {
      const nextFrame = clampFrame(current, viewportSize);
      rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
      return nextFrame;
    });
  }, [viewportSize.height, viewportSize.width]);

  useEffect(() => {
    setFrame((current) => {
      const nextFrame = current.width > 0 && current.height > 0
        ? clampFrame(current, viewportSize)
        : clampFrame(initialFrame, viewportSize);
      rndRef.current?.updateSize({ width: nextFrame.width, height: nextFrame.height });
      rndRef.current?.updatePosition({ x: nextFrame.x, y: nextFrame.y });
      return nextFrame;
    });
  }, [initialFrame.height, initialFrame.width, initialFrame.x, initialFrame.y, viewportSize]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Rnd
      ref={rndRef}
      bounds="window"
      data-testid="floating-board-window"
      className="board-resizable-wrap"
      dragHandleClassName="board-drag-handle"
      enableUserSelectHack={false}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      resizeGrid={[1, 1]}
      dragGrid={[1, 1]}
      minWidth={420}
      minHeight={360}
      maxWidth={Math.max(420, viewportSize.width - 36)}
      maxHeight={Math.max(360, viewportSize.height - 114)}
      default={{ x: frame.x, y: frame.y, width: frame.width, height: frame.height }}
      onDragStop={(_event, data) => {
        setFrame((current) => ({ ...current, x: data.x, y: data.y }));
      }}
      onResizeStop={(_event, _direction, ref, _delta, position) => {
        setFrame({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
      }}
      style={{ position: "fixed", zIndex: 5 }}
    >
      <div className="board-window" data-testid="board-window-surface">
        <div className="board__hero board-window__toolbar board-drag-handle" data-testid="board-window-handle">
          {toolbar}
        </div>
        <div className="board-window__canvas">{children}</div>
      </div>
    </Rnd>,
    document.body,
  );
}
