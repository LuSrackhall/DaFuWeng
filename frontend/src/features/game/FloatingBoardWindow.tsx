import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    setFrame((current) => clampFrame(current, viewportSize));
  }, [viewportSize.height, viewportSize.width]);

  useEffect(() => {
    setFrame((current) => {
      if (current.width > 0 && current.height > 0) {
        return clampFrame(current, viewportSize);
      }

      return clampFrame(initialFrame, viewportSize);
    });
  }, [initialFrame.height, initialFrame.width, initialFrame.x, initialFrame.y, viewportSize]);

  return (
    <Rnd
      bounds="window"
      className="board-resizable-wrap"
      dragHandleClassName="board-drag-handle"
      enableUserSelectHack={false}
      resizeGrid={[1, 1]}
      dragGrid={[1, 1]}
      minWidth={420}
      minHeight={360}
      maxWidth={Math.max(420, viewportSize.width - 36)}
      maxHeight={Math.max(360, viewportSize.height - 114)}
      position={{ x: frame.x, y: frame.y }}
      size={{ width: frame.width, height: frame.height }}
      onDrag={(_event, data) => {
        setFrame((current) => ({ ...current, x: data.x, y: data.y }));
      }}
      onDragStop={(_event, data) => {
        setFrame((current) => ({ ...current, x: data.x, y: data.y }));
      }}
      onResize={(_event, _direction, ref, _delta, position) => {
        setFrame({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
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
      <div className="board-window">
        <div className="board__hero board-window__toolbar board-drag-handle">
          {toolbar}
        </div>
        <div className="board-window__canvas">{children}</div>
      </div>
    </Rnd>
  );
}
