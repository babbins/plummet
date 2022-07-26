import { useBox } from "@react-three/cannon";
import { Text3D } from "@react-three/drei";
import { randomBetween } from "utils/random-between";

interface WordProps extends Partial<React.ComponentProps<typeof Text3D>> {
  text: string;
  completedIndex?: number;
}

export const Word = ({ text, ...props }: WordProps) => {
  const [textRef, textApi] = useBox(() => ({
    mass: randomBetween(0.1, 20),
    position: [randomBetween(-10, 10), 25, 5],
  }));

  return (
    <>
      <Text3D
        castShadow
        scale={1}
        //@ts-ignore
        ref={textRef}
        size={1}
        font={"/Hack_Regular.json"}
        bevelEnabled
        bevelSize={0.05}
        bevelSegments={4}
        {...props}
      >
        <meshBasicMaterial color="#3B3231" />
        {text.slice(props.completedIndex).padStart(text.length, " ")}
      </Text3D>
    </>
  );
};
