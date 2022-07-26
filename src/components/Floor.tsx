import { usePlane } from "@react-three/cannon";
import { Plane } from "@react-three/drei";

interface FloorProps {
  onCollide: () => void;
}

export const Floor = ({ onCollide }: FloorProps) => {
  const [ref, planeApi] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    onCollide,
    args: [100, 100],
  }));

  return (
    <Plane ref={ref} receiveShadow args={[100, 100]}>
      <meshBasicMaterial color="#f6c484" />
    </Plane>
  );
};
